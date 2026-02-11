import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { LabelFormat, LabelElement, ElementStyle, BeerFieldType } from '../../types/label';
import { useCanvas } from '../../hooks/useCanvas';

interface CanvasEditorProps {
  format: LabelFormat;
  onSelectionChange: (element: LabelElement | null) => void;
  onFabricSelectionChange?: (obj: fabric.FabricObject | null) => void;
  onObjectsChange?: (objects: fabric.FabricObject[]) => void;
  actionsRef: React.MutableRefObject<{
    addText: (content: string, fieldType: string) => void;
    addImage: (url: string, isBackground: boolean) => void;
    addRectangle: (color: string, strokeColor: string) => void;
    addCircle: (color: string, strokeColor: string) => void;
    addLine: (color: string) => void;
    updateCurve: (options: { enabled: boolean; radius?: number; curve?: number; flip?: boolean }) => void;
    updateStyle: (style: Partial<ElementStyle>) => void;
    updateImageStyle: (props: {
      opacity?: number;
      brightness?: number;
      contrast?: number;
      saturation?: number;
      blur?: number;
      grayscale?: boolean;
      sepia?: boolean;
      invert?: boolean;
    }) => void;
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
  } | null>;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  format,
  onSelectionChange,
  onFabricSelectionChange,
  onObjectsChange,
  actionsRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale based on container size
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const padding = 80;

      const mmToPx = 3.7795275591;
      const labelWidthPx = format.width * mmToPx;
      const labelHeightPx = format.height * mmToPx;

      const scaleX = (containerWidth - padding * 2) / labelWidthPx;
      const scaleY = (containerHeight - padding * 2) / labelHeightPx;

      setScale(Math.min(scaleX, scaleY, 2));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [format.width, format.height]);

  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const alignMenuRef = useRef<HTMLDivElement>(null);

  const {
    canvasRef,
    selectedObject,
    zoom,
    canUndo,
    canRedo,
    // Grid & guides
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    showSmartGuides,
    setShowSmartGuides,
    // Alignment
    alignObjects,
    distributeObjects,
    // Canvas actions
    addText,
    addRectangle,
    addCircle,
    addLine,
    updateCurve,
    addImage,
    updateSelectedStyle,
    updateImageStyle,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    selectObject,
    getObjects,
    toDataURL,
    toJSON,
    loadFromJSON,
    loadFromJSONRaw,
    clearCanvas,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvas({
    format,
    scale,
    onSelectionChange,
    onObjectsChange,
  });

  // Close align menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alignMenuRef.current && !alignMenuRef.current.contains(e.target as Node)) {
        setShowAlignMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAlign = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    alignObjects(alignment);
    setShowAlignMenu(false);
  }, [alignObjects]);

  const handleDistribute = useCallback((direction: 'horizontal' | 'vertical') => {
    distributeObjects(direction);
    setShowAlignMenu(false);
  }, [distributeObjects]);

  // Notify parent of fabric object selection changes
  useEffect(() => {
    if (onFabricSelectionChange) {
      onFabricSelectionChange(selectedObject);
    }
  }, [selectedObject, onFabricSelectionChange]);

  // Expose actions to parent
  useEffect(() => {
    actionsRef.current = {
      addText: (content: string, fieldType: string) => {
        addText(content, fieldType as BeerFieldType);
      },
      addImage: (url: string, isBackground: boolean) => {
        addImage(url, isBackground);
      },
      addRectangle,
      addCircle,
      addLine,
      updateCurve,
      updateStyle: updateSelectedStyle,
      updateImageStyle,
      deleteSelected,
      duplicateSelected,
      undo,
      redo,
      bringForward,
      sendBackward,
      bringToFront,
      sendToBack,
      selectObject,
      getObjects,
      toDataURL,
      toJSON,
      loadFromJSON,
      loadFromJSONRaw,
      clearCanvas,
    };
  }, [addText, addImage, addRectangle, addCircle, addLine, updateCurve, updateSelectedStyle, updateImageStyle, deleteSelected, duplicateSelected, undo, redo, bringForward, sendBackward, bringToFront, sendToBack, selectObject, getObjects, toDataURL, toJSON, loadFromJSON, loadFromJSONRaw, clearCanvas, actionsRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditing = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isEditing) {
          deleteSelected();
        }
      }

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }

      // Duplicate: Ctrl+D
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo, duplicateSelected]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline">
            {format.name} - {format.width} x {format.height} mm
          </span>

          {/* Undo/Redo buttons */}
          <div className="flex items-center gap-1 sm:border-l border-gray-600 sm:pl-4">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-2 rounded transition-colors ${
                canUndo
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              title="Annuler (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-2 rounded transition-colors ${
                canRedo
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              title="Rétablir (Ctrl+Y)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          {/* Grid & Guides */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-4">
            {/* Grid toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded transition-colors ${
                showGrid ? 'bg-amber-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="Afficher la grille"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 9h16M4 14h16M9 4v16M14 4v16" />
              </svg>
            </button>

            {/* Snap toggle */}
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded transition-colors ${
                snapToGrid ? 'bg-amber-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={`Magnétisme ${snapToGrid ? 'activé' : 'désactivé'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            {/* Smart guides toggle */}
            <button
              onClick={() => setShowSmartGuides(!showSmartGuides)}
              className={`p-2 rounded transition-colors ${
                showSmartGuides ? 'bg-amber-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={`Guides intelligents ${showSmartGuides ? 'activés' : 'désactivés'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21V3m10 18V3M3 7h18M3 17h18" />
              </svg>
            </button>

            {/* Grid size selector */}
            {showGrid && (
              <select
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="ml-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                title="Taille de la grille (px)"
              >
                <option value={5}>5px</option>
                <option value={10}>10px</option>
                <option value={15}>15px</option>
                <option value={20}>20px</option>
                <option value={25}>25px</option>
              </select>
            )}
          </div>

          {/* Alignment */}
          <div className="relative border-l border-gray-600 pl-4" ref={alignMenuRef}>
            <button
              onClick={() => setShowAlignMenu(!showAlignMenu)}
              className={`p-2 rounded transition-colors ${
                showAlignMenu ? 'bg-amber-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="Alignement et distribution"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            </button>

            {/* Align dropdown */}
            {showAlignMenu && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-50 p-3 w-56">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">Aligner</p>
                <div className="grid grid-cols-3 gap-1 mb-3">
                  <button onClick={() => handleAlign('left')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Aligner à gauche">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="4" y1="4" x2="4" y2="20" strokeWidth={2} /><rect x="4" y="6" width="12" height="4" rx="1" strokeWidth={1.5} /><rect x="4" y="14" width="8" height="4" rx="1" strokeWidth={1.5} /></svg>
                    Gauche
                  </button>
                  <button onClick={() => handleAlign('center-h')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Centrer horizontalement">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="4" x2="12" y2="20" strokeWidth={2} /><rect x="6" y="6" width="12" height="4" rx="1" strokeWidth={1.5} /><rect x="8" y="14" width="8" height="4" rx="1" strokeWidth={1.5} /></svg>
                    Centre H
                  </button>
                  <button onClick={() => handleAlign('right')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Aligner à droite">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="20" y1="4" x2="20" y2="20" strokeWidth={2} /><rect x="8" y="6" width="12" height="4" rx="1" strokeWidth={1.5} /><rect x="12" y="14" width="8" height="4" rx="1" strokeWidth={1.5} /></svg>
                    Droite
                  </button>
                  <button onClick={() => handleAlign('top')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Aligner en haut">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="4" y1="4" x2="20" y2="4" strokeWidth={2} /><rect x="6" y="4" width="4" height="12" rx="1" strokeWidth={1.5} /><rect x="14" y="4" width="4" height="8" rx="1" strokeWidth={1.5} /></svg>
                    Haut
                  </button>
                  <button onClick={() => handleAlign('center-v')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Centrer verticalement">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="4" y1="12" x2="20" y2="12" strokeWidth={2} /><rect x="6" y="6" width="4" height="12" rx="1" strokeWidth={1.5} /><rect x="14" y="8" width="4" height="8" rx="1" strokeWidth={1.5} /></svg>
                    Centre V
                  </button>
                  <button onClick={() => handleAlign('bottom')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Aligner en bas">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="4" y1="20" x2="20" y2="20" strokeWidth={2} /><rect x="6" y="8" width="4" height="12" rx="1" strokeWidth={1.5} /><rect x="14" y="12" width="4" height="8" rx="1" strokeWidth={1.5} /></svg>
                    Bas
                  </button>
                </div>

                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">Distribuer</p>
                <div className="grid grid-cols-2 gap-1">
                  <button onClick={() => handleDistribute('horizontal')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Distribuer horizontalement (3+ objets)">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="8" width="4" height="8" rx="1" strokeWidth={1.5} /><rect x="10" y="8" width="4" height="8" rx="1" strokeWidth={1.5} /><rect x="17" y="8" width="4" height="8" rx="1" strokeWidth={1.5} /></svg>
                    Horizontal
                  </button>
                  <button onClick={() => handleDistribute('vertical')} className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors" title="Distribuer verticalement (3+ objets)">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="8" y="3" width="8" height="4" rx="1" strokeWidth={1.5} /><rect x="8" y="10" width="8" height="4" rx="1" strokeWidth={1.5} /><rect x="8" y="17" width="8" height="4" rx="1" strokeWidth={1.5} /></svg>
                    Vertical
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-600">
                  <p className="text-[10px] text-gray-500">1 objet = aligner au canvas. 2+ objets = aligner entre eux. 3+ = distribuer.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            title="Zoom arrière"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            title="Zoom avant"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-8">
        <div
          className="shadow-2xl"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out',
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Help Text */}
      <div className="px-4 py-2 bg-gray-800/30 text-center text-xs text-gray-500">
        Double-clic pour éditer le texte | Suppr pour supprimer | Ctrl+Z/Y pour annuler/rétablir | Ctrl+D pour dupliquer
      </div>
    </div>
  );
};
