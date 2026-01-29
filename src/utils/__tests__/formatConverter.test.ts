import { describe, it, expect } from 'vitest';
import {
  mmToPx,
  pxToMm,
  mmToPxHD,
  pxToMmHD,
  ptToPx,
  pxToPt,
  scaleFontSize,
  getDisplayScale,
} from '../formatConverter';

// Constants from labelFormats.ts
const MM_TO_PX_96DPI = 3.7795275591;
const MM_TO_PX_300DPI = 11.811023622;

describe('formatConverter', () => {
  describe('mmToPx', () => {
    it('should convert mm to pixels at 96 DPI with default scale', () => {
      expect(mmToPx(1)).toBeCloseTo(MM_TO_PX_96DPI);
      expect(mmToPx(10)).toBeCloseTo(10 * MM_TO_PX_96DPI);
      expect(mmToPx(100)).toBeCloseTo(100 * MM_TO_PX_96DPI);
    });

    it('should apply scale factor correctly', () => {
      expect(mmToPx(10, 2)).toBeCloseTo(10 * MM_TO_PX_96DPI * 2);
      expect(mmToPx(10, 0.5)).toBeCloseTo(10 * MM_TO_PX_96DPI * 0.5);
    });

    it('should handle zero values', () => {
      expect(mmToPx(0)).toBe(0);
      expect(mmToPx(0, 2)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(mmToPx(-10)).toBeCloseTo(-10 * MM_TO_PX_96DPI);
    });
  });

  describe('pxToMm', () => {
    it('should convert pixels to mm at 96 DPI with default scale', () => {
      expect(pxToMm(MM_TO_PX_96DPI)).toBeCloseTo(1);
      expect(pxToMm(10 * MM_TO_PX_96DPI)).toBeCloseTo(10);
      expect(pxToMm(100 * MM_TO_PX_96DPI)).toBeCloseTo(100);
    });

    it('should apply scale factor correctly', () => {
      expect(pxToMm(10 * MM_TO_PX_96DPI * 2, 2)).toBeCloseTo(10);
      expect(pxToMm(10 * MM_TO_PX_96DPI * 0.5, 0.5)).toBeCloseTo(10);
    });

    it('should be inverse of mmToPx', () => {
      const original = 50;
      const scale = 1.5;
      const converted = mmToPx(original, scale);
      const backConverted = pxToMm(converted, scale);
      expect(backConverted).toBeCloseTo(original);
    });

    it('should handle zero values', () => {
      expect(pxToMm(0)).toBe(0);
    });
  });

  describe('mmToPxHD', () => {
    it('should convert mm to pixels at 300 DPI', () => {
      expect(mmToPxHD(1)).toBeCloseTo(MM_TO_PX_300DPI);
      expect(mmToPxHD(10)).toBeCloseTo(10 * MM_TO_PX_300DPI);
    });

    it('should give higher pixel values than 96 DPI', () => {
      const mm = 10;
      expect(mmToPxHD(mm)).toBeGreaterThan(mmToPx(mm));
    });

    it('should handle zero values', () => {
      expect(mmToPxHD(0)).toBe(0);
    });
  });

  describe('pxToMmHD', () => {
    it('should convert pixels to mm at 300 DPI', () => {
      expect(pxToMmHD(MM_TO_PX_300DPI)).toBeCloseTo(1);
      expect(pxToMmHD(10 * MM_TO_PX_300DPI)).toBeCloseTo(10);
    });

    it('should be inverse of mmToPxHD', () => {
      const original = 25;
      const converted = mmToPxHD(original);
      const backConverted = pxToMmHD(converted);
      expect(backConverted).toBeCloseTo(original);
    });
  });

  describe('ptToPx', () => {
    it('should convert points to pixels', () => {
      expect(ptToPx(1)).toBeCloseTo(1.333);
      expect(ptToPx(12)).toBeCloseTo(12 * 1.333);
      expect(ptToPx(72)).toBeCloseTo(72 * 1.333);
    });

    it('should handle zero values', () => {
      expect(ptToPx(0)).toBe(0);
    });

    it('should handle standard font sizes', () => {
      // Common font sizes
      expect(ptToPx(10)).toBeCloseTo(13.33, 1);
      expect(ptToPx(14)).toBeCloseTo(18.662, 1);
      expect(ptToPx(16)).toBeCloseTo(21.328, 1);
    });
  });

  describe('pxToPt', () => {
    it('should convert pixels to points', () => {
      expect(pxToPt(1.333)).toBeCloseTo(1);
      expect(pxToPt(12 * 1.333)).toBeCloseTo(12);
    });

    it('should be inverse of ptToPx', () => {
      const original = 16;
      const converted = ptToPx(original);
      const backConverted = pxToPt(converted);
      expect(backConverted).toBeCloseTo(original);
    });
  });

  describe('scaleFontSize', () => {
    it('should scale font size correctly', () => {
      expect(scaleFontSize(12, 1)).toBe(12);
      expect(scaleFontSize(12, 2)).toBe(24);
      expect(scaleFontSize(12, 0.5)).toBe(6);
    });

    it('should handle zero scale', () => {
      expect(scaleFontSize(12, 0)).toBe(0);
    });

    it('should handle zero font size', () => {
      expect(scaleFontSize(0, 2)).toBe(0);
    });
  });

  describe('getDisplayScale', () => {
    it('should calculate correct scale for fitting label in container', () => {
      // Container 800x600, label 100mm x 100mm
      const labelPx = mmToPx(100);
      const scale = getDisplayScale(800, 600, 100, 100);

      // Should fit within the container accounting for padding
      const scaledWidth = labelPx * scale;
      const scaledHeight = labelPx * scale;

      expect(scaledWidth).toBeLessThanOrEqual(800 - 80); // 40px padding on each side
      expect(scaledHeight).toBeLessThanOrEqual(600 - 80);
    });

    it('should respect width constraint when label is wider', () => {
      // Wide container, narrow height
      const scale = getDisplayScale(800, 400, 100, 50);
      const labelWidthPx = mmToPx(100) * scale;

      expect(labelWidthPx).toBeLessThanOrEqual(800 - 80);
    });

    it('should respect height constraint when label is taller', () => {
      // Narrow container, tall label
      const scale = getDisplayScale(400, 800, 50, 100);
      const labelHeightPx = mmToPx(100) * scale;

      expect(labelHeightPx).toBeLessThanOrEqual(800 - 80);
    });

    it('should not exceed maximum scale of 2x', () => {
      // Very large container, small label
      const scale = getDisplayScale(2000, 2000, 10, 10);
      expect(scale).toBeLessThanOrEqual(2);
    });

    it('should use custom padding', () => {
      const scaleDefault = getDisplayScale(800, 600, 100, 100, 40);
      const scaleMorePadding = getDisplayScale(800, 600, 100, 100, 100);

      expect(scaleMorePadding).toBeLessThan(scaleDefault);
    });

    it('should handle standard beer label formats', () => {
      // Standard 33cl label: 90mm x 120mm
      const scale33cl = getDisplayScale(800, 600, 90, 120);
      expect(scale33cl).toBeGreaterThan(0);
      expect(scale33cl).toBeLessThanOrEqual(2);

      // Canette 33cl: 95mm x 65mm
      const scaleCanette = getDisplayScale(800, 600, 95, 65);
      expect(scaleCanette).toBeGreaterThan(0);
      expect(scaleCanette).toBeLessThanOrEqual(2);
    });
  });
});
