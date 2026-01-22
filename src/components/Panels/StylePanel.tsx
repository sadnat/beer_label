import React from 'react';
import { LabelElement, ElementStyle } from '../../types/label';
import { GOOGLE_FONTS } from '../../constants/defaultStyles';

interface StylePanelProps {
  selectedElement: LabelElement | null;
  onStyleChange: (style: Partial<ElementStyle>) => void;
  onDeleteElement: () => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  selectedElement,
  onStyleChange,
  onDeleteElement,
}) => {
  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p className="text-center">
          Sélectionnez un élément<br />
          <span className="text-sm">pour modifier son style</span>
        </p>
      </div>
    );
  }

  const isText = selectedElement.type === 'text';

  return (
    <div className="space-y-6">
      {/* Element Info */}
      <section className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              {isText ? 'Texte' : 'Image'}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-[180px]">
              {selectedElement.content || 'Sans contenu'}
            </p>
          </div>
          <button
            onClick={onDeleteElement}
            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </section>

      {isText && (
        <>
          {/* Font Family */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Police
            </h3>
            <select
              value={selectedElement.style.fontFamily}
              onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
          </section>

          {/* Font Size */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Taille
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={selectedElement.style.fontSize}
                onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value) })}
                min={6}
                max={72}
                className="flex-1 accent-amber-500"
              />
              <input
                type="number"
                value={selectedElement.style.fontSize}
                onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value) || 12 })}
                min={6}
                max={200}
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </section>

          {/* Font Style */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Style de police
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => onStyleChange({
                  fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold'
                })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors font-bold ${
                  selectedElement.style.fontWeight === 'bold'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                B
              </button>
              <button
                onClick={() => onStyleChange({
                  fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic'
                })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors italic ${
                  selectedElement.style.fontStyle === 'italic'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                I
              </button>
              <button
                onClick={() => onStyleChange({
                  textDecoration: selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline'
                })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors underline ${
                  selectedElement.style.textDecoration === 'underline'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                U
              </button>
            </div>
          </section>

          {/* Text Alignment */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Alignement
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => onStyleChange({ textAlign: 'left' })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                  selectedElement.style.textAlign === 'left'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                </svg>
              </button>
              <button
                onClick={() => onStyleChange({ textAlign: 'center' })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                  selectedElement.style.textAlign === 'center'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                </svg>
              </button>
              <button
                onClick={() => onStyleChange({ textAlign: 'right' })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                  selectedElement.style.textAlign === 'right'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                </svg>
              </button>
            </div>
          </section>

          {/* Color */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Couleur
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={selectedElement.style.color}
                onChange={(e) => onStyleChange({ color: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={selectedElement.style.color}
                onChange={(e) => onStyleChange({ color: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>
            {/* Quick Colors */}
            <div className="flex gap-2 mt-3">
              {['#000000', '#ffffff', '#d4af37', '#8b4513', '#228b22', '#1e3a5f'].map((color) => (
                <button
                  key={color}
                  onClick={() => onStyleChange({ color })}
                  className="w-8 h-8 rounded border-2 border-gray-600 hover:border-amber-500 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </section>

          {/* Line Height & Letter Spacing */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Espacement
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Interligne</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={selectedElement.style.lineHeight}
                    onChange={(e) => onStyleChange({ lineHeight: parseFloat(e.target.value) })}
                    min={0.8}
                    max={3}
                    step={0.1}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {selectedElement.style.lineHeight.toFixed(1)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Espacement lettres</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={selectedElement.style.letterSpacing}
                    onChange={(e) => onStyleChange({ letterSpacing: parseInt(e.target.value) })}
                    min={-5}
                    max={20}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {selectedElement.style.letterSpacing}px
                  </span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
