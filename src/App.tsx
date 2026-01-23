import React, { useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Header, Sidebar, MainArea } from './components/Layout';
import { ElementsPanel } from './components/Panels/ElementsPanel';
import { FormatPanel } from './components/Panels/FormatPanel';
import { StylePanel } from './components/Panels/StylePanel';
import { LayersPanel } from './components/Panels/LayersPanel';
import { CanvasEditor } from './components/Editor/CanvasEditor';
import { TemplateGallery } from './components/Templates/TemplateGallery';
import { MultiLabelExport } from './components/Export/MultiLabelExport';
import { Template } from './data/templates';
import { LabelFormat, LabelElement, BeerLabelData, ElementStyle } from './types/label';
import { LABEL_FORMATS } from './constants/labelFormats';
import { DEFAULT_BEER_DATA } from './constants/defaultStyles';
import jsPDF from 'jspdf';

function App() {
  const [projectName] = useState('Ma nouvelle étiquette');
  const [format, setFormat] = useState<LabelFormat>(LABEL_FORMATS[0]);
  const [beerData, setBeerData] = useState<BeerLabelData>(DEFAULT_BEER_DATA);
  const [selectedElement, setSelectedElement] = useState<LabelElement | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<fabric.FabricObject[]>([]);
  const [selectedFabricObject, setSelectedFabricObject] = useState<fabric.FabricObject | null>(null);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isMultiExportOpen, setIsMultiExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    clearCanvas: () => void;
  } | null>(null);

  const handleSave = useCallback(() => {
    const projectData = {
      name: projectName,
      format,
      beerData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('beerLabelProject', JSON.stringify(projectData));
    alert('Projet sauvegardé!');
  }, [projectName, format, beerData]);

  const handleExport = useCallback(() => {
    if (!canvasActionsRef.current || isExporting) return;

    setIsExporting(true);
    const startTime = Date.now();

    // Use setTimeout to allow React to render the loading state before heavy work
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
        // Ensure loading state is visible for at least 500ms
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

  const handleAddElement = useCallback((fieldType: string, content: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addText(content, fieldType);
    }
  }, []);

  const handleAddImage = useCallback((url: string, isBackground: boolean) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addImage(url, isBackground);
    }
  }, []);

  const handleStyleChange = useCallback((style: Partial<ElementStyle>) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.updateStyle(style);
    }
  }, []);

  const handleImageStyleChange = useCallback((props: ImageStyleProps) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.updateImageStyle(props);
    }
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.deleteSelected();
    }
  }, []);

  const handleAddRectangle = useCallback((color: string, strokeColor: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addRectangle(color, strokeColor);
    }
  }, []);

  const handleAddCircle = useCallback((color: string, strokeColor: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addCircle(color, strokeColor);
    }
  }, []);

  const handleAddLine = useCallback((color: string) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.addLine(color);
    }
  }, []);

  const handleObjectsChange = useCallback((objects: fabric.FabricObject[]) => {
    setCanvasObjects([...objects]);
  }, []);

  const handleSelectObject = useCallback((obj: fabric.FabricObject) => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.selectObject(obj);
      setSelectedFabricObject(obj);
    }
  }, []);

  const handleBringForward = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.bringForward();
    }
  }, []);

  const handleSendBackward = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.sendBackward();
    }
  }, []);

  const handleBringToFront = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.bringToFront();
    }
  }, []);

  const handleSendToBack = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.sendToBack();
    }
  }, []);

  const handleDuplicateSelected = useCallback(() => {
    if (canvasActionsRef.current) {
      canvasActionsRef.current.duplicateSelected();
    }
  }, []);

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
    }
  }, []);

  const getCanvasDataURL = useCallback((multiplier: number): string => {
    if (canvasActionsRef.current) {
      return canvasActionsRef.current.toDataURL(multiplier);
    }
    return '';
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <Header
        projectName={projectName}
        onSave={handleSave}
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

export default App;
