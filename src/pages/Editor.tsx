import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as fabric from 'fabric';
import { Header, Sidebar, MainArea } from '../components/Layout';
import { ElementsPanel } from '../components/Panels/ElementsPanel';
import { FormatPanel } from '../components/Panels/FormatPanel';
import { StylePanel } from '../components/Panels/StylePanel';
import { LayersPanel } from '../components/Panels/LayersPanel';
import { CanvasEditor } from '../components/Editor/CanvasEditor';
import { TemplateGallery } from '../components/Templates/TemplateGallery';
import { MultiLabelExport } from '../components/Export/MultiLabelExport';
import { Template } from '../data/templates';
import { LabelFormat, LabelElement, BeerLabelData, ElementStyle } from '../types/label';
import { LABEL_FORMATS } from '../constants/labelFormats';
import { DEFAULT_BEER_DATA } from '../constants/defaultStyles';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';

// Image style props type
type ImageStyleProps = {
  opacity?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
};

export function EditorPage() {
  const { id: projectId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [projectName, setProjectName] = useState('Ma nouvelle étiquette');
  const [format, setFormat] = useState<LabelFormat>(LABEL_FORMATS[0]);
  const [beerData, setBeerData] = useState<BeerLabelData>(DEFAULT_BEER_DATA);
  const [selectedElement, setSelectedElement] = useState<LabelElement | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<fabric.FabricObject[]>([]);
  const [selectedFabricObject, setSelectedFabricObject] = useState<fabric.FabricObject | null>(null);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isMultiExportOpen, setIsMultiExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!projectId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingLoad, setPendingLoad] = useState<string | null>(null); // Canvas JSON to load

  // For auto-save debounce
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentProjectIdRef = useRef<string | null>(null);
  const hasChangesRef = useRef(false);
  const canvasReadyRef = useRef(false);
  const justSavedRef = useRef(false); // Track if we just saved to avoid reload

  // Canvas action refs
  const canvasActionsRef = React.useRef<{
    addText: (content: string, fieldType: string) => void;
    addImage: (url: string, isBackground: boolean) => void;
    addRectangle: (color: string, strokeColor: string) => void;
    addCircle: (color: string, strokeColor: string) => void;
    addLine: (color: string) => void;
    updateStyle: (style: Partial<ElementStyle>) => void;
    updateImageStyle: (props: ImageStyleProps) => void;
    deleteSelected: () => void;
    duplicateSelected: () => Promise<fabric.FabricObject | undefined>;
    undo: () => void;
    redo: () => void;
    bringForward: () => void;
    sendBackward: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    selectObject: (obj: fabric.FabricObject) => void;
    getObjects: () => fabric.FabricObject[];
    toDataURL: (multiplier: number) => string;
    toJSON: () => string;
    loadFromJSON: (json: string) => Promise<void>;
    loadFromJSONRaw: (json: string) => Promise<void>;
    clearCanvas: () => void;
  } | null>(null);

  // Load project if editing existing
  useEffect(() => {
    if (projectId) {
      // Skip loading if we just saved (URL changed after save)
      if (justSavedRef.current) {
        justSavedRef.current = false;
        return;
      }
      loadProject(projectId);
    }
  }, [projectId]);

  // Load pending canvas JSON when canvas becomes available
  useEffect(() => {
    if (!pendingLoad) return;

    const loadPendingCanvas = async () => {
      if (canvasActionsRef.current) {
        try {
          await canvasActionsRef.current.loadFromJSONRaw(pendingLoad);
          canvasReadyRef.current = true;
        } catch (err) {
          console.error('Failed to load canvas JSON:', err);
        }
        setPendingLoad(null);
        setIsLoading(false);
      } else {
        // Canvas not ready yet, retry
        setTimeout(loadPendingCanvas, 100);
      }
    };

    // Delay to ensure canvas is fully initialized
    const timer = setTimeout(loadPendingCanvas, 300);
    return () => clearTimeout(timer);
  }, [pendingLoad]); // Re-run when pendingLoad changes

  const loadProject = async (id: string) => {
    setIsLoading(true);
    setLoadError(null);

    const { data, error } = await api.getProject(id);

    if (error) {
      setLoadError(error);
      setIsLoading(false);
      return;
    }

    if (data?.project) {
      const project = data.project;
      setProjectName(project.name);
      currentProjectIdRef.current = project.id;

      // Store canvas JSON to load after format is set and canvas is ready
      if (project.canvas_json) {
        setPendingLoad(project.canvas_json);
      } else {
        setIsLoading(false);
      }

      // Load beer data
      if (project.beer_data && typeof project.beer_data === 'object') {
        setBeerData(project.beer_data as unknown as BeerLabelData);
      }

      // Find matching format - this will trigger canvas recreation
      const matchingFormat = LABEL_FORMATS.find(f => f.id === project.format_id);
      if (matchingFormat) {
        setFormat(matchingFormat);
      } else {
        setFormat({
          id: project.format_id,
          name: 'Format personnalisé',
          width: project.format_width,
          height: project.format_height,
          description: '',
        });
      }
      // Canvas JSON will be loaded by the useEffect above when canvas is ready
    } else {
      setIsLoading(false);
    }
  };

  // Mark changes for auto-save
  const markUnsaved = useCallback(() => {
    if (!canvasReadyRef.current && projectId) return; // Don't mark unsaved during initial load

    hasChangesRef.current = true;
    setSaveStatus('unsaved');

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save after 30 seconds of no changes
    saveTimeoutRef.current = setTimeout(() => {
      if (hasChangesRef.current) {
        handleSave(true);
      }
    }, 30000);
  }, [projectId]);

  // Watch for changes
  useEffect(() => {
    if (canvasReadyRef.current || !projectId) {
      markUnsaved();
    }
  }, [beerData, format, projectName]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!canvasActionsRef.current || isSaving) return;

    setIsSaving(true);
    setSaveStatus('saving');

    const canvasJson = canvasActionsRef.current.toJSON();
    const thumbnail = canvasActionsRef.current.toDataURL(0.5);

    const projectData = {
      name: projectName,
      format_id: format.id,
      format_width: format.width,
      format_height: format.height,
      canvas_json: canvasJson,
      beer_data: beerData as unknown as Record<string, unknown>,
      thumbnail,
    };

    let result;

    if (currentProjectIdRef.current) {
      // Update existing project
      result = await api.updateProject(currentProjectIdRef.current, projectData);
    } else {
      // Create new project
      result = await api.createProject(projectData);
    }

    if (result.error) {
      setSaveStatus('error');
      if (!isAutoSave) {
        alert(`Erreur: ${result.error}`);
      }
    } else if (result.data?.project) {
      currentProjectIdRef.current = result.data.project.id;
      hasChangesRef.current = false;
      setSaveStatus('saved');

      // Update URL if this was a new project
      if (!projectId && result.data.project.id) {
        justSavedRef.current = true; // Prevent reload after URL change
        navigate(`/editor/${result.data.project.id}`, { replace: true });
      }

      if (!isAutoSave) {
        // Brief feedback
        setTimeout(() => setSaveStatus('saved'), 1000);
      }
    }

    setIsSaving(false);
  }, [projectName, format, beerData, isSaving, projectId, navigate]);

  const handleExport = useCallback(() => {
    if (!canvasActionsRef.current || isExporting) return;

    setIsExporting(true);
    const startTime = Date.now();

    setTimeout(() => {
      try {
        const dataUrl = canvasActionsRef.current!.toDataURL(3);

        const pdf = new jsPDF({
          orientation: format.width > format.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [format.width, format.height],
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, format.width, format.height);
        pdf.save(`${projectName.replace(/\s+/g, '_')}.pdf`);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Erreur lors de l\'export. Veuillez réessayer.');
      } finally {
        const elapsed = Date.now() - startTime;
        const minDisplayTime = 500;
        if (elapsed < minDisplayTime) {
          setTimeout(() => setIsExporting(false), minDisplayTime - elapsed);
        } else {
          setIsExporting(false);
        }
      }
    }, 100);
  }, [format, projectName, isExporting]);

  const handleLogout = async () => {
    // Save before logout if needed
    if (hasChangesRef.current && canvasActionsRef.current) {
      await handleSave(true);
    }
    await logout();
    navigate('/');
  };

  const handleAddElement = useCallback((fieldType: string, content: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addText(content, fieldType);
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleAddImage = useCallback((url: string, isBackground: boolean) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addImage(url, isBackground);
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleStyleChange = useCallback((style: Partial<ElementStyle>) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.updateStyle(style);
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleImageStyleChange = useCallback((props: ImageStyleProps) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.updateImageStyle(props);
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleDeleteSelected = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.deleteSelected();
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleAddRectangle = useCallback((color: string, strokeColor: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addRectangle(color, strokeColor);
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleAddCircle = useCallback((color: string, strokeColor: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addCircle(color, strokeColor);
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleAddLine = useCallback((color: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addLine(color);
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleObjectsChange = useCallback((objects: fabric.FabricObject[]) => {
    setCanvasObjects([...objects]);
    markUnsaved();
  }, [markUnsaved]);

  const handleSelectObject = useCallback((obj: fabric.FabricObject) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.selectObject(obj);
      setSelectedFabricObject(obj);
    }
  }, []);

  const handleBringForward = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.bringForward();
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleSendBackward = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.sendBackward();
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleBringToFront = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.bringToFront();
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleSendToBack = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.sendToBack();
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleDuplicateSelected = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.duplicateSelected();
      markUnsaved();
    }
  }, [markUnsaved]);

  const handleFormatChange = useCallback((newFormat: LabelFormat) => {
    setFormat(newFormat);
  }, []);

  const handleBeerDataChange = useCallback((field: keyof BeerLabelData, value: string | number) => {
    setBeerData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSelectTemplate = useCallback((template: Template) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.loadFromJSON(template.canvasJSON);
      markUnsaved();
    }
  }, [markUnsaved]);

  const getCanvasDataURL = useCallback((multiplier: number): string => {
    if (canvasActionsRef.current) {
      return canvasActionsRef.current.toDataURL(multiplier);
    }
    return '';
  }, []);

  // Error state (only show if not loading)
  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-white mb-2">Projet introuvable</h2>
          <p className="text-gray-400 mb-6">{loadError}</p>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Chargement du projet...</p>
          </div>
        </div>
      )}

      {/* Navigation bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
          <span className="text-gray-600">|</span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-amber-500 transition"
          />
          <span className={`text-xs px-2 py-1 rounded ${
            saveStatus === 'saved' ? 'bg-green-900/50 text-green-400' :
            saveStatus === 'saving' ? 'bg-amber-900/50 text-amber-400' :
            saveStatus === 'error' ? 'bg-red-900/50 text-red-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            {saveStatus === 'saved' ? 'Sauvegardé' :
             saveStatus === 'saving' ? 'Sauvegarde...' :
             saveStatus === 'error' ? 'Erreur' :
             'Non sauvegardé'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <Header
        projectName={projectName}
        onSave={() => handleSave(false)}
        onExport={handleExport}
        onOpenTemplates={() => setIsTemplateGalleryOpen(true)}
        onOpenMultiExport={() => setIsMultiExportOpen(true)}
        isExporting={isExporting}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar>
          <div data-tab="elements">
            <ElementsPanel
              beerData={beerData}
              onBeerDataChange={handleBeerDataChange}
              onAddElement={handleAddElement}
              onAddImage={handleAddImage}
              onAddRectangle={handleAddRectangle}
              onAddCircle={handleAddCircle}
              onAddLine={handleAddLine}
            />
          </div>
          <div data-tab="layers">
            <LayersPanel
              objects={canvasObjects}
              selectedObject={selectedFabricObject}
              onSelectObject={handleSelectObject}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onDeleteObject={handleDeleteSelected}
              onDuplicateObject={handleDuplicateSelected}
            />
          </div>
          <div data-tab="format">
            <FormatPanel
              currentFormat={format}
              onFormatChange={handleFormatChange}
            />
          </div>
          <div data-tab="style">
            <StylePanel
              selectedElement={selectedElement}
              selectedFabricObject={selectedFabricObject}
              onStyleChange={handleStyleChange}
              onImageStyleChange={handleImageStyleChange}
              onDeleteElement={handleDeleteSelected}
            />
          </div>
        </Sidebar>

        <MainArea>
          <CanvasEditor
            format={format}
            onSelectionChange={setSelectedElement}
            onFabricSelectionChange={setSelectedFabricObject}
            onObjectsChange={handleObjectsChange}
            actionsRef={canvasActionsRef}
          />
        </MainArea>
      </div>

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Multi-Label Export Modal */}
      <MultiLabelExport
        isOpen={isMultiExportOpen}
        onClose={() => setIsMultiExportOpen(false)}
        format={format}
        getCanvasDataURL={getCanvasDataURL}
      />
    </div>
  );
}
