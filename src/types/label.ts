export interface LabelFormat {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  description: string;
}

export interface LabelElement {
  id: string;
  type: 'text' | 'image';
  fieldType?: BeerFieldType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  content: string;
  style: ElementStyle;
  // Curve properties for text-on-path
  curveEnabled?: boolean;
  curveRadius?: number;
  curveAngle?: number;
  curveFlip?: boolean;
}

export interface ElementStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  opacity?: number;
  shadow?: ShadowStyle;
  stroke?: StrokeStyle;
}

export interface ShadowStyle {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface StrokeStyle {
  color: string;
  width: number;
}

export type BeerFieldType =
  | 'breweryName'
  | 'breweryAddress'
  | 'beerName'
  | 'beerStyle'
  | 'alcoholDegree'
  | 'volume'
  | 'ebc'
  | 'ibu'
  | 'ingredients'
  | 'custom';

export interface BeerLabelData {
  breweryName: string;
  breweryAddress: string;
  beerName: string;
  beerStyle: string;
  alcoholDegree: number;
  volume: number;
  volumeUnit: 'cl' | 'ml' | 'L';
  ebc: number;
  ibu: number;
  ingredients: string;
}

export interface LabelProject {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  format: LabelFormat;
  elements: LabelElement[];
  beerData: BeerLabelData;
  backgroundImage?: string;
}
