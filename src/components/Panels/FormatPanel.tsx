import React, { useState } from 'react';
import { LabelFormat } from '../../types/label';
import { LABEL_FORMATS } from '../../constants/labelFormats';

interface FormatPanelProps {
  currentFormat: LabelFormat;
  onFormatChange: (format: LabelFormat) => void;
}

export const FormatPanel: React.FC<FormatPanelProps> = ({
  currentFormat,
  onFormatChange,
}) => {
  const [customWidth, setCustomWidth] = useState(currentFormat.width);
  const [customHeight, setCustomHeight] = useState(currentFormat.height);

  const handleFormatSelect = (format: LabelFormat) => {
    if (format.id === 'custom') {
      onFormatChange({
        ...format,
        width: customWidth,
        height: customHeight,
      });
    } else {
      onFormatChange(format);
    }
  };

  const handleCustomDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (dimension === 'width') {
      setCustomWidth(value);
    } else {
      setCustomHeight(value);
    }

    if (currentFormat.id === 'custom') {
      onFormatChange({
        ...currentFormat,
        width: dimension === 'width' ? value : customWidth,
        height: dimension === 'height' ? value : customHeight,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Predefined Formats */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Formats Prédéfinis
        </h3>
        <div className="space-y-2">
          {LABEL_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => handleFormatSelect(format)}
              className={`w-full px-4 py-3 rounded-lg border transition-all text-left ${
                currentFormat.id === format.id
                  ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{format.name}</span>
                <span className="text-xs text-gray-400">
                  {format.width} x {format.height} mm
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{format.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Custom Dimensions */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Dimensions Personnalisées
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Largeur (mm)</label>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => handleCustomDimensionChange('width', parseInt(e.target.value) || 0)}
              min={10}
              max={500}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hauteur (mm)</label>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => handleCustomDimensionChange('height', parseInt(e.target.value) || 0)}
              min={10}
              max={500}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <button
          onClick={() => handleFormatSelect({
            id: 'custom',
            name: 'Personnalisé',
            width: customWidth,
            height: customHeight,
            description: 'Dimensions personnalisées',
          })}
          className="w-full mt-3 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
        >
          Appliquer dimensions
        </button>
      </section>

      {/* Current Format Info */}
      <section className="bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-2">Format actuel</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p><span className="text-gray-400">Nom:</span> {currentFormat.name}</p>
          <p><span className="text-gray-400">Dimensions:</span> {currentFormat.width} x {currentFormat.height} mm</p>
        </div>
      </section>

      {/* Format Preview */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Aperçu
        </h3>
        <div className="flex items-center justify-center bg-gray-700/30 rounded-lg p-4">
          <div
            className="bg-white border-2 border-amber-500 rounded"
            style={{
              width: `${Math.min(currentFormat.width, 150)}px`,
              height: `${Math.min(currentFormat.height * (150 / Math.max(currentFormat.width, currentFormat.height)), 200)}px`,
              aspectRatio: `${currentFormat.width} / ${currentFormat.height}`,
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              {currentFormat.width} x {currentFormat.height}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
