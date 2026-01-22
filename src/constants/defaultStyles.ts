import { ElementStyle, BeerLabelData } from '../types/label';

export const GOOGLE_FONTS = [
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Lato', value: 'Lato' },
  { name: 'Oswald', value: 'Oswald' },
  { name: 'Raleway', value: 'Raleway' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Poppins', value: 'Poppins' },
  { name: 'Ubuntu', value: 'Ubuntu' },
];

export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  fontFamily: 'Roboto',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  textAlign: 'left',
  lineHeight: 1.2,
  letterSpacing: 0,
};

export const DEFAULT_BEER_DATA: BeerLabelData = {
  breweryName: 'Ma Brasserie',
  breweryAddress: '123 Rue de la Bière\n75001 Paris',
  beerName: 'Golden Ale',
  beerStyle: 'Blonde',
  alcoholDegree: 5.5,
  volume: 33,
  volumeUnit: 'cl',
  ebc: 8,
  ibu: 25,
  ingredients: 'Eau, malt d\'orge, houblon, levure',
};

export const FIELD_LABELS: Record<string, string> = {
  breweryName: 'Nom de la brasserie',
  breweryAddress: 'Adresse',
  beerName: 'Nom de la bière',
  beerStyle: 'Style',
  alcoholDegree: 'Degré d\'alcool',
  volume: 'Volume',
  ebc: 'EBC',
  ibu: 'IBU',
  ingredients: 'Ingrédients',
  custom: 'Texte personnalisé',
};

export const FIELD_DEFAULT_STYLES: Record<string, Partial<ElementStyle>> = {
  breweryName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  breweryAddress: {
    fontSize: 8,
    textAlign: 'center',
  },
  beerName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Playfair Display',
  },
  beerStyle: {
    fontSize: 14,
    textAlign: 'center',
  },
  alcoholDegree: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  volume: {
    fontSize: 10,
  },
  ebc: {
    fontSize: 10,
  },
  ibu: {
    fontSize: 10,
  },
  ingredients: {
    fontSize: 8,
    lineHeight: 1.4,
  },
  custom: {
    fontSize: 12,
  },
};
