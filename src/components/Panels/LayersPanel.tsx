import React from 'react';
import * as fabric from 'fabric';

interface LayersPanelProps {
  objects: fabric.FabricObject[];
  selectedObject: fabric.FabricObject | null;
  onSelectObject: (obj: fabric.FabricObject) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDeleteObject: () => void;
  onDuplicateObject: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  objects,
  selectedObject,
  onSelectObject,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDeleteObject,
  onDuplicateObject,
}) => {
  // Display objects in reverse order (top layer first)
  const reversedObjects = [...objects].reverse();

  const getObjectName = (obj: fabric.FabricObject): string => {
    const customName = (obj as fabric.FabricObject & { elementName?: string }).elementName;
    if (customName) return customName;

    if (obj instanceof fabric.IText || obj instanceof fabric.Text) {
      const text = (obj as fabric.IText).text || '';
      return text.length > 15 ? text.substring(0, 15) + '...' : text || 'Texte';
    }
    if (obj instanceof fabric.Rect) return 'Rectangle';
    if (obj instanceof fabric.Circle) return 'Cercle';
    if (obj instanceof fabric.Line) return 'Ligne';
    if (obj instanceof fabric.FabricImage) return 'Image';
    return 'Objet';
  };

  const getObjectIcon = (obj: fabric.FabricObject): React.ReactNode => {
    if (obj instanceof fabric.IText || obj instanceof fabric.Text) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      );
    }
    if (obj instanceof fabric.Rect) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="1" strokeWidth={2} />
        </svg>
      );
    }
    if (obj instanceof fabric.Circle) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
        </svg>
      );
    }
    if (obj instanceof fabric.Line) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="4" y1="20" x2="20" y2="4" strokeWidth={2} strokeLinecap="round" />
        </svg>
      );
    }
    if (obj instanceof fabric.FabricImage) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
      </svg>
    );
  };

  const isSelected = (obj: fabric.FabricObject): boolean => {
    return selectedObject === obj;
  };

  return (
    <div className="space-y-4">
      {/* Header with layer count */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
          Calques ({objects.length})
        </h3>
      </div>

      {/* Layer actions */}
      {selectedObject && (
        <div className="flex flex-wrap gap-1 pb-3 border-b border-gray-700">
          <button
            onClick={onBringToFront}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            title="Premier plan"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={onBringForward}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            title="Avancer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={onSendBackward}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            title="Reculer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onSendToBack}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            title="Arriere-plan"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button
            onClick={onDuplicateObject}
            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            title="Dupliquer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onDeleteObject}
            className="flex items-center gap-1 px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs transition-colors"
            title="Supprimer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Layer list */}
      <div className="space-y-1">
        {reversedObjects.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">Aucun calque</p>
            <p className="text-xs mt-1">Ajoutez des elements pour commencer</p>
          </div>
        ) : (
          reversedObjects.map((obj, index) => (
            <button
              key={index}
              onClick={() => onSelectObject(obj)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-left ${
                isSelected(obj)
                  ? 'bg-amber-600/30 border border-amber-500 text-amber-400'
                  : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-transparent'
              }`}
            >
              <span className="text-gray-500">
                {getObjectIcon(obj)}
              </span>
              <span className="flex-1 truncate text-sm">
                {getObjectName(obj)}
              </span>
              <span className="text-xs text-gray-500">
                {objects.length - index}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Help text */}
      <div className="pt-4 border-t border-gray-700 text-xs text-gray-500">
        <p>Cliquez sur un calque pour le selectionner.</p>
        <p className="mt-1">Utilisez les fleches pour reordonner.</p>
      </div>
    </div>
  );
};
