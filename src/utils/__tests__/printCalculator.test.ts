import { describe, it, expect } from 'vitest';
import { calculatePrintLayout, getLabelPositions, PrintLayout } from '../printCalculator';

// Constants from labelFormats.ts
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const DEFAULT_PRINT_MARGIN = 10;

describe('printCalculator', () => {
  describe('calculatePrintLayout', () => {
    it('should calculate layout for standard 33cl labels (90x120mm)', () => {
      const layout = calculatePrintLayout(90, 120);

      expect(layout.labelsPerRow).toBeGreaterThanOrEqual(1);
      expect(layout.labelsPerColumn).toBeGreaterThanOrEqual(1);
      expect(layout.totalLabels).toBe(layout.labelsPerRow * layout.labelsPerColumn);
      expect(['portrait', 'landscape']).toContain(layout.orientation);
    });

    it('should calculate layout for canette labels (95x65mm)', () => {
      const layout = calculatePrintLayout(95, 65);

      // Canette labels are wide and short, should fit multiple per row
      expect(layout.labelsPerRow).toBeGreaterThanOrEqual(1);
      expect(layout.labelsPerColumn).toBeGreaterThanOrEqual(1);
      expect(layout.totalLabels).toBeGreaterThanOrEqual(1);
    });

    it('should calculate layout for longneck labels (70x100mm)', () => {
      const layout = calculatePrintLayout(70, 100);

      // Should fit at least 2 per row on A4
      expect(layout.labelsPerRow).toBeGreaterThanOrEqual(2);
      expect(layout.totalLabels).toBeGreaterThanOrEqual(4);
    });

    it('should use default margin and spacing', () => {
      const layout = calculatePrintLayout(90, 120);

      expect(layout.marginX).toBeGreaterThan(0);
      expect(layout.marginY).toBeGreaterThan(0);
      expect(layout.spacingX).toBe(2); // Default spacing
      expect(layout.spacingY).toBe(2);
    });

    it('should respect custom margin', () => {
      const layoutDefault = calculatePrintLayout(90, 120, DEFAULT_PRINT_MARGIN);
      const layoutLargeMargin = calculatePrintLayout(90, 120, 30);

      // Larger margin should result in fewer or equal labels
      expect(layoutLargeMargin.totalLabels).toBeLessThanOrEqual(layoutDefault.totalLabels);
    });

    it('should respect custom spacing', () => {
      const layoutDefault = calculatePrintLayout(90, 120, DEFAULT_PRINT_MARGIN, 2);
      const layoutLargeSpacing = calculatePrintLayout(90, 120, DEFAULT_PRINT_MARGIN, 10);

      // Larger spacing should result in fewer or equal labels
      expect(layoutLargeSpacing.totalLabels).toBeLessThanOrEqual(layoutDefault.totalLabels);
    });

    it('should choose portrait or landscape based on maximum labels', () => {
      // Wide label - might favor landscape
      const wideLayout = calculatePrintLayout(150, 50);
      expect(['portrait', 'landscape']).toContain(wideLayout.orientation);

      // Tall label - might favor portrait
      const tallLayout = calculatePrintLayout(50, 150);
      expect(['portrait', 'landscape']).toContain(tallLayout.orientation);
    });

    it('should handle very small labels', () => {
      const layout = calculatePrintLayout(20, 20);

      // Should fit many small labels
      expect(layout.totalLabels).toBeGreaterThan(10);
    });

    it('should handle labels that barely fit', () => {
      // Label almost as large as A4 minus margins
      const layout = calculatePrintLayout(180, 270);

      expect(layout.labelsPerRow).toBe(1);
      expect(layout.labelsPerColumn).toBe(1);
      expect(layout.totalLabels).toBe(1);
    });

    it('should handle labels larger than page', () => {
      // Label larger than A4
      const layout = calculatePrintLayout(250, 350);

      // Should still return at least 1 label (minimum)
      expect(layout.totalLabels).toBe(1);
    });

    it('should center labels on the page', () => {
      const layout = calculatePrintLayout(90, 120);
      const pageWidth = layout.orientation === 'portrait' ? A4_WIDTH_MM : A4_HEIGHT_MM;
      const pageHeight = layout.orientation === 'portrait' ? A4_HEIGHT_MM : A4_WIDTH_MM;

      const usedWidth = layout.labelsPerRow * 90 + (layout.labelsPerRow - 1) * layout.spacingX;
      const usedHeight = layout.labelsPerColumn * 120 + (layout.labelsPerColumn - 1) * layout.spacingY;

      // Margins should center the labels
      const expectedMarginX = (pageWidth - usedWidth) / 2;
      const expectedMarginY = (pageHeight - usedHeight) / 2;

      expect(layout.marginX).toBeCloseTo(expectedMarginX, 1);
      expect(layout.marginY).toBeCloseTo(expectedMarginY, 1);
    });

    it('should have consistent spacing values', () => {
      const layout = calculatePrintLayout(90, 120, 10, 5);

      expect(layout.spacingX).toBe(5);
      expect(layout.spacingY).toBe(5);
    });
  });

  describe('getLabelPositions', () => {
    it('should return correct number of positions', () => {
      const layout: PrintLayout = {
        labelsPerRow: 2,
        labelsPerColumn: 3,
        totalLabels: 6,
        orientation: 'portrait',
        marginX: 10,
        marginY: 10,
        spacingX: 5,
        spacingY: 5,
      };

      const positions = getLabelPositions(layout, 90, 120);

      expect(positions).toHaveLength(6);
    });

    it('should start positions from top-left margin', () => {
      const layout: PrintLayout = {
        labelsPerRow: 2,
        labelsPerColumn: 2,
        totalLabels: 4,
        orientation: 'portrait',
        marginX: 15,
        marginY: 20,
        spacingX: 5,
        spacingY: 5,
      };

      const positions = getLabelPositions(layout, 90, 120);

      expect(positions[0].x).toBe(15);
      expect(positions[0].y).toBe(20);
    });

    it('should calculate correct x positions for multiple columns', () => {
      const layout: PrintLayout = {
        labelsPerRow: 3,
        labelsPerColumn: 1,
        totalLabels: 3,
        orientation: 'portrait',
        marginX: 10,
        marginY: 10,
        spacingX: 5,
        spacingY: 5,
      };

      const labelWidth = 50;
      const positions = getLabelPositions(layout, labelWidth, 100);

      expect(positions[0].x).toBe(10);
      expect(positions[1].x).toBe(10 + labelWidth + 5);
      expect(positions[2].x).toBe(10 + 2 * (labelWidth + 5));
    });

    it('should calculate correct y positions for multiple rows', () => {
      const layout: PrintLayout = {
        labelsPerRow: 1,
        labelsPerColumn: 3,
        totalLabels: 3,
        orientation: 'portrait',
        marginX: 10,
        marginY: 10,
        spacingX: 5,
        spacingY: 5,
      };

      const labelHeight = 80;
      const positions = getLabelPositions(layout, 50, labelHeight);

      expect(positions[0].y).toBe(10);
      expect(positions[1].y).toBe(10 + labelHeight + 5);
      expect(positions[2].y).toBe(10 + 2 * (labelHeight + 5));
    });

    it('should return positions in row-major order', () => {
      const layout: PrintLayout = {
        labelsPerRow: 2,
        labelsPerColumn: 2,
        totalLabels: 4,
        orientation: 'portrait',
        marginX: 0,
        marginY: 0,
        spacingX: 0,
        spacingY: 0,
      };

      const positions = getLabelPositions(layout, 50, 50);

      // First row
      expect(positions[0]).toEqual({ x: 0, y: 0 });
      expect(positions[1]).toEqual({ x: 50, y: 0 });
      // Second row
      expect(positions[2]).toEqual({ x: 0, y: 50 });
      expect(positions[3]).toEqual({ x: 50, y: 50 });
    });

    it('should handle single label', () => {
      const layout: PrintLayout = {
        labelsPerRow: 1,
        labelsPerColumn: 1,
        totalLabels: 1,
        orientation: 'portrait',
        marginX: 60,
        marginY: 88.5,
        spacingX: 2,
        spacingY: 2,
      };

      const positions = getLabelPositions(layout, 90, 120);

      expect(positions).toHaveLength(1);
      expect(positions[0]).toEqual({ x: 60, y: 88.5 });
    });

    it('should work with actual calculated layout', () => {
      const layout = calculatePrintLayout(90, 120);
      const positions = getLabelPositions(layout, 90, 120);

      expect(positions).toHaveLength(layout.totalLabels);

      // All positions should be positive (within page bounds)
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have no overlapping positions', () => {
      const layout = calculatePrintLayout(90, 120);
      const positions = getLabelPositions(layout, 90, 120);

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const pos1 = positions[i];
          const pos2 = positions[j];

          // Check if labels would overlap
          const overlapX = pos1.x < pos2.x + 90 && pos1.x + 90 > pos2.x;
          const overlapY = pos1.y < pos2.y + 120 && pos1.y + 120 > pos2.y;

          if (overlapX && overlapY) {
            // If they overlap in both dimensions, they're overlapping
            expect(overlapX && overlapY).toBe(false);
          }
        }
      }
    });
  });
});
