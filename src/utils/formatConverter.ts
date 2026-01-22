import { MM_TO_PX_96DPI, MM_TO_PX_300DPI } from '../constants/labelFormats';

/**
 * Convert millimeters to pixels for screen display (96 DPI)
 */
export function mmToPx(mm: number, scale: number = 1): number {
  return mm * MM_TO_PX_96DPI * scale;
}

/**
 * Convert pixels to millimeters for screen display (96 DPI)
 */
export function pxToMm(px: number, scale: number = 1): number {
  return px / (MM_TO_PX_96DPI * scale);
}

/**
 * Convert millimeters to pixels for high-resolution export (300 DPI)
 */
export function mmToPxHD(mm: number): number {
  return mm * MM_TO_PX_300DPI;
}

/**
 * Convert pixels to millimeters for high-resolution export (300 DPI)
 */
export function pxToMmHD(px: number): number {
  return px / MM_TO_PX_300DPI;
}

/**
 * Convert points to pixels (1pt = 1.333px at 96 DPI)
 */
export function ptToPx(pt: number): number {
  return pt * 1.333;
}

/**
 * Convert pixels to points
 */
export function pxToPt(px: number): number {
  return px / 1.333;
}

/**
 * Scale font size for canvas display
 */
export function scaleFontSize(fontSize: number, scale: number): number {
  return fontSize * scale;
}

/**
 * Get display scale factor based on container size and label dimensions
 */
export function getDisplayScale(
  containerWidth: number,
  containerHeight: number,
  labelWidthMm: number,
  labelHeightMm: number,
  padding: number = 40
): number {
  const labelWidthPx = mmToPx(labelWidthMm);
  const labelHeightPx = mmToPx(labelHeightMm);

  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;

  const scaleX = availableWidth / labelWidthPx;
  const scaleY = availableHeight / labelHeightPx;

  return Math.min(scaleX, scaleY, 2); // Max scale of 2x
}
