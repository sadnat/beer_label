import React, { useEffect, useRef, useState } from 'react';
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
    updateStyle: (style: Partial<ElementStyle>) => void;
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

  const {
    canvasRef,
    selectedObject,
    zoom,
    canUndo,
    canRedo,
    addText,
    addRectangle,
    addCircle,
    addLine,
    addImage,
    updateSelectedStyle,
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
      updateStyle: updateSelectedStyle,
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
      clearCanvas,
    };
  }, [addText, addImage, addRectangle, addCircle, addLine, updateSelectedStyle, deleteSelected, duplicateSelected, undo, redo, bringForward, sendBackward, bringToFront, sendToBack, selectObject, getObjects, toDataURL, toJSON, loadFromJSON, clearCanvas, actionsRef]);

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
          <span className="text-sm text-gray-400">
            {format.name} - {format.width} x {format.height} mm
          </span>

          {/* Undo/Redo buttons */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-4">
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
