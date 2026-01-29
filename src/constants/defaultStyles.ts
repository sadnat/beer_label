import { ElementStyle, BeerLabelData } from '../types/label';

interface FontOption {
  name: string;
  value: string;
  disabled?: boolean;
}

export const GOOGLE_FONTS: FontOption[] = [
  // === SANS-SERIF & MODERN ===
  { name: '── Sans-Serif ──', value: '', disabled: true },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Lato', value: 'Lato' },
  { name: 'Poppins', value: 'Poppins' },
  { name: 'Ubuntu', value: 'Ubuntu' },
  { name: 'Raleway', value: 'Raleway' },
  { name: 'Oswald', value: 'Oswald' },
  { name: 'Bebas Neue', value: 'Bebas Neue' },
  { name: 'Anton', value: 'Anton' },
  { name: 'Archivo Black', value: 'Archivo Black' },
  { name: 'Barlow Condensed', value: 'Barlow Condensed' },
  { name: 'Staatliches', value: 'Staatliches' },
  { name: 'Teko', value: 'Teko' },
  { name: 'Fjalla One', value: 'Fjalla One' },
  { name: 'Russo One', value: 'Russo One' },

  // === SERIF & CLASSIC ===
  { name: '── Serif Classique ──', value: '', disabled: true },
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville' },
  { name: 'Cinzel', value: 'Cinzel' },
  { name: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { name: 'EB Garamond', value: 'EB Garamond' },
  { name: 'Crimson Text', value: 'Crimson Text' },
  { name: 'Spectral', value: 'Spectral' },
  { name: 'Old Standard TT', value: 'Old Standard TT' },
  { name: 'Cardo', value: 'Cardo' },

  // === DISPLAY & DECORATIVE ===
  { name: '── Décoratif ──', value: '', disabled: true },
  { name: 'Lobster', value: 'Lobster' },
  { name: 'Pacifico', value: 'Pacifico' },
  { name: 'Permanent Marker', value: 'Permanent Marker' },
  { name: 'Righteous', value: 'Righteous' },
  { name: 'Bangers', value: 'Bangers' },
  { name: 'Fredoka One', value: 'Fredoka One' },
  { name: 'Bungee', value: 'Bungee' },
  { name: 'Bungee Shade', value: 'Bungee Shade' },
  { name: 'Rubik Mono One', value: 'Rubik Mono One' },
  { name: 'Black Ops One', value: 'Black Ops One' },
  { name: 'Creepster', value: 'Creepster' },
  { name: 'Special Elite', value: 'Special Elite' },
  { name: 'Press Start 2P', value: 'Press Start 2P' },
  { name: 'VT323', value: 'VT323' },
  { name: 'Audiowide', value: 'Audiowide' },
  { name: 'Orbitron', value: 'Orbitron' },

  // === SCRIPT & HANDWRITING ===
  { name: '── Script & Manuscrit ──', value: '', disabled: true },
  { name: 'Dancing Script', value: 'Dancing Script' },
  { name: 'Great Vibes', value: 'Great Vibes' },
  { name: 'Satisfy', value: 'Satisfy' },
  { name: 'Allura', value: 'Allura' },
  { name: 'Sacramento', value: 'Sacramento' },
  { name: 'Parisienne', value: 'Parisienne' },
  { name: 'Tangerine', value: 'Tangerine' },
  { name: 'Alex Brush', value: 'Alex Brush' },
  { name: 'Kaushan Script', value: 'Kaushan Script' },
  { name: 'Caveat', value: 'Caveat' },
  { name: 'Indie Flower', value: 'Indie Flower' },
  { name: 'Shadows Into Light', value: 'Shadows Into Light' },
  { name: 'Handlee', value: 'Handlee' },
  { name: 'Amatic SC', value: 'Amatic SC' },
  { name: 'Rock Salt', value: 'Rock Salt' },

  // === VINTAGE & RETRO ===
  { name: '── Vintage & Rétro ──', value: '', disabled: true },
  { name: 'Alfa Slab One', value: 'Alfa Slab One' },
  { name: 'Passion One', value: 'Passion One' },
  { name: 'Bowlby One SC', value: 'Bowlby One SC' },
  { name: 'Fraunces', value: 'Fraunces' },
  { name: 'Abril Fatface', value: 'Abril Fatface' },
  { name: 'Yeseva One', value: 'Yeseva One' },
  { name: 'Titan One', value: 'Titan One' },
  { name: 'Fugaz One', value: 'Fugaz One' },
  { name: 'Lilita One', value: 'Lilita One' },
  { name: 'Monoton', value: 'Monoton' },
  { name: 'Fascinate', value: 'Fascinate' },
  { name: 'Fascinate Inline', value: 'Fascinate Inline' },

  // === GOTHIC & BLACKLETTER ===
  { name: '── Gothique & Western ──', value: '', disabled: true },
  { name: '── Western & Slab ──', value: '', disabled: true },
  { name: 'Rye', value: 'Rye' },
  { name: 'Ultra', value: 'Ultra' },
  { name: 'Graduate', value: 'Graduate' },
  { name: 'UnifrakturMaguntia', value: 'UnifrakturMaguntia' },
  { name: 'MedievalSharp', value: 'MedievalSharp' },
  { name: 'Pirata One', value: 'Pirata One' },
  { name: 'Nosifer', value: 'Nosifer' },
  { name: 'Eater', value: 'Eater' },
  { name: 'Butcherman', value: 'Butcherman' },
  
  // === INDUSTRIAL & STENCIL ===
  { name: '── Industriel & Pochoir ──', value: '', disabled: true },
  { name: 'Major Mono Display', value: 'Major Mono Display' },
  { name: 'Megrim', value: 'Megrim' },
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
