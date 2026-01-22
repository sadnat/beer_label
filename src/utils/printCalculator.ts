import { A4_WIDTH_MM, A4_HEIGHT_MM, DEFAULT_PRINT_MARGIN } from '../constants/labelFormats';

export interface PrintLayout {
  labelsPerRow: number;
  labelsPerColumn: number;
  totalLabels: number;
  orientation: 'portrait' | 'landscape';
  marginX: number;
  marginY: number;
  spacingX: number;
  spacingY: number;
}

/**
 * Calculate optimal layout for labels on A4 paper
 */
export function calculatePrintLayout(
  labelWidthMm: number,
  labelHeightMm: number,
  marginMm: number = DEFAULT_PRINT_MARGIN,
  spacingMm: number = 2
): PrintLayout {
  // Try portrait orientation
  const portraitLayout = calculateLayoutForOrientation(
    labelWidthMm,
    labelHeightMm,
    A4_WIDTH_MM,
    A4_HEIGHT_MM,
    marginMm,
    spacingMm
  );

  // Try landscape orientation
  const landscapeLayout = calculateLayoutForOrientation(
    labelWidthMm,
    labelHeightMm,
    A4_HEIGHT_MM,
    A4_WIDTH_MM,
    marginMm,
    spacingMm
  );

  // Return the orientation with more labels
  if (landscapeLayout.totalLabels > portraitLayout.totalLabels) {
    return { ...landscapeLayout, orientation: 'landscape' };
  }
  return { ...portraitLayout, orientation: 'portrait' };
}

function calculateLayoutForOrientation(
  labelWidth: number,
  labelHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  spacing: number
): Omit<PrintLayout, 'orientation'> {
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  // Calculate how many labels fit
  const labelsPerRow = Math.floor((availableWidth + spacing) / (labelWidth + spacing));
  const labelsPerColumn = Math.floor((availableHeight + spacing) / (labelHeight + spacing));

  // Calculate actual margins to center the labels
  const usedWidth = labelsPerRow * labelWidth + (labelsPerRow - 1) * spacing;
  const usedHeight = labelsPerColumn * labelHeight + (labelsPerColumn - 1) * spacing;

  const marginX = (pageWidth - usedWidth) / 2;
  const marginY = (pageHeight - usedHeight) / 2;

  return {
    labelsPerRow: Math.max(1, labelsPerRow),
    labelsPerColumn: Math.max(1, labelsPerColumn),
    totalLabels: Math.max(1, labelsPerRow) * Math.max(1, labelsPerColumn),
    marginX,
    marginY,
    spacingX: spacing,
    spacingY: spacing,
  };
}

/**
 * Get positions for all labels on the page
 */
export function getLabelPositions(
  layout: PrintLayout,
  labelWidthMm: number,
  labelHeightMm: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];

  for (let row = 0; row < layout.labelsPerColumn; row++) {
    for (let col = 0; col < layout.labelsPerRow; col++) {
      positions.push({
        x: layout.marginX + col * (labelWidthMm + layout.spacingX),
        y: layout.marginY + row * (labelHeightMm + layout.spacingY),
      });
    }
  }

  return positions;
}
