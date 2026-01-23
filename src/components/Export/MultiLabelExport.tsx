import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { LabelFormat } from '../../types/label';
import { calculatePrintLayout, getLabelPositions, PrintLayout } from '../../utils/printCalculator';
import { A4_WIDTH_MM, A4_HEIGHT_MM } from '../../constants/labelFormats';

interface MultiLabelExportProps {
  isOpen: boolean;
  onClose: () => void;
  format: LabelFormat;
  getCanvasDataURL: (multiplier: number) => string;
}

export const MultiLabelExport: React.FC<MultiLabelExportProps> = ({
  isOpen,
  onClose,
  format,
  getCanvasDataURL,
}) => {
  const [margin, setMargin] = useState(10);
  const [spacing, setSpacing] = useState(2);
  const [showCutMarks, setShowCutMarks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate layout based on settings
  const layout: PrintLayout = useMemo(() => {
    return calculatePrintLayout(format.width, format.height, margin, spacing);
  }, [format.width, format.height, margin, spacing]);

  // Get label positions for preview
  const positions = useMemo(() => {
    return getLabelPositions(layout, format.width, format.height);
  }, [layout, format.width, format.height]);

  // Page dimensions based on orientation
  const pageWidth = layout.orientation === 'landscape' ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageHeight = layout.orientation === 'landscape' ? A4_WIDTH_MM : A4_HEIGHT_MM;

  // Scale for preview (fit in container)
  const previewScale = Math.min(400 / pageWidth, 500 / pageHeight);

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);

    // Use setTimeout to allow React to render the loading state before heavy work
    setTimeout(() => {
      try {
        // Get canvas image at high resolution
        const dataUrl = getCanvasDataURL(4); // Higher multiplier for quality

        // Create PDF
        const pdf = new jsPDF({
          orientation: layout.orientation,
          unit: 'mm',
          format: 'a4',
        });

        // Add cut marks if enabled
        if (showCutMarks) {
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.1);

          positions.forEach(pos => {
            // Top-left corner
            pdf.line(pos.x - 3, pos.y, pos.x - 1, pos.y);
            pdf.line(pos.x, pos.y - 3, pos.x, pos.y - 1);

            // Top-right corner
            pdf.line(pos.x + format.width + 1, pos.y, pos.x + format.width + 3, pos.y);
            pdf.line(pos.x + format.width, pos.y - 3, pos.x + format.width, pos.y - 1);

            // Bottom-left corner
            pdf.line(pos.x - 3, pos.y + format.height, pos.x - 1, pos.y + format.height);
            pdf.line(pos.x, pos.y + format.height + 1, pos.x, pos.y + format.height + 3);

            // Bottom-right corner
            pdf.line(pos.x + format.width + 1, pos.y + format.height, pos.x + format.width + 3, pos.y + format.height);
            pdf.line(pos.x + format.width, pos.y + format.height + 1, pos.x + format.width, pos.y + format.height + 3);
          });
        }

        // Add labels
        positions.forEach(pos => {
          pdf.addImage(dataUrl, 'PNG', pos.x, pos.y, format.width, format.height);
        });

        // Save the PDF
        pdf.save(`etiquettes_${format.name.replace(/\s+/g, '_')}_x${layout.totalLabels}.pdf`);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Erreur lors de l\'export. Veuillez reessayer.');
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Export Multi-Etiquettes A4</h2>
            <p className="text-sm text-gray-400 mt-1">
              Configurez la disposition des etiquettes sur une page A4
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-8">
            {/* Settings */}
            <div className="w-64 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
                  Format d'etiquette
                </h3>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-white font-medium">{format.name}</p>
                  <p className="text-gray-400 text-sm">{format.width} x {format.height} mm</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
                  Marges (mm)
                </h3>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5mm</span>
                  <span className="text-amber-400 font-medium">{margin}mm</span>
                  <span>25mm</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
                  Espacement (mm)
                </h3>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={spacing}
                  onChange={(e) => setSpacing(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0mm</span>
                  <span className="text-amber-400 font-medium">{spacing}mm</span>
                  <span>10mm</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCutMarks}
                    onChange={(e) => setShowCutMarks(e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-amber-600 focus:ring-amber-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-sm text-white">Traits de coupe</span>
                </label>
              </div>

              {/* Stats */}
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Orientation:</span>
                  <span className="text-white font-medium">
                    {layout.orientation === 'portrait' ? 'Portrait' : 'Paysage'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Colonnes:</span>
                  <span className="text-white font-medium">{layout.labelsPerRow}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Lignes:</span>
                  <span className="text-white font-medium">{layout.labelsPerColumn}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-600 pt-2 mt-2">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-amber-400 font-bold text-lg">{layout.totalLabels} etiquettes</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
                Apercu de la page A4
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                <div
                  className="bg-white relative shadow-lg"
                  style={{
                    width: pageWidth * previewScale,
                    height: pageHeight * previewScale,
                  }}
                >
                  {/* Label placeholders */}
                  {positions.map((pos, index) => (
                    <div
                      key={index}
                      className="absolute bg-amber-100 border border-amber-400"
                      style={{
                        left: pos.x * previewScale,
                        top: pos.y * previewScale,
                        width: format.width * previewScale,
                        height: format.height * previewScale,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-amber-600 text-xs font-medium">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Cut marks preview */}
                  {showCutMarks && positions.map((pos, index) => (
                    <React.Fragment key={`cuts-${index}`}>
                      {/* Simplified cut marks representation */}
                      <div
                        className="absolute w-1 bg-gray-300"
                        style={{
                          left: (pos.x - 2) * previewScale,
                          top: pos.y * previewScale,
                          height: 1,
                          width: 4,
                        }}
                      />
                    </React.Fragment>
                  ))}

                  {/* Page size indicator */}
                  <div className="absolute bottom-1 right-1 text-[8px] text-gray-400">
                    A4 ({pageWidth}x{pageHeight}mm)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {layout.totalLabels} etiquettes seront exportees sur une page A4
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isExporting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Export en cours...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exporter PDF ({layout.totalLabels} etiquettes)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
