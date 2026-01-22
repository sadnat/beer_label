import { LabelFormat } from '../types/label';

export const LABEL_FORMATS: LabelFormat[] = [
  {
    id: 'standard-33cl',
    name: 'Standard 33cl',
    width: 90,
    height: 120,
    description: 'Bouteille standard 33cl',
  },
  {
    id: 'longneck-33cl',
    name: 'Longneck 33cl',
    width: 70,
    height: 100,
    description: 'Bouteille longneck 33cl',
  },
  {
    id: '75cl',
    name: 'Bouteille 75cl',
    width: 100,
    height: 140,
    description: 'Grande bouteille 75cl',
  },
  {
    id: 'canette-33cl',
    name: 'Canette 33cl',
    width: 95,
    height: 65,
    description: 'Canette standard 33cl',
  },
  {
    id: 'custom',
    name: 'Personnalisé',
    width: 80,
    height: 100,
    description: 'Dimensions personnalisées',
  },
];

// A4 dimensions in mm
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Default margins for printing (mm)
export const DEFAULT_PRINT_MARGIN = 10;

// DPI for export
export const EXPORT_DPI = 300;

// Conversion factor: 1 mm = 3.7795275591 pixels at 96 DPI
export const MM_TO_PX_96DPI = 3.7795275591;

// Conversion factor for 300 DPI export
export const MM_TO_PX_300DPI = 11.811023622;
