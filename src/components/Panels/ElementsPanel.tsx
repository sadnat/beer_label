import React, { useState, useRef } from 'react';
import { BeerLabelData, BeerFieldType } from '../../types/label';

interface ElementsPanelProps {
  beerData: BeerLabelData;
  onBeerDataChange: (field: keyof BeerLabelData, value: string | number) => void;
  onAddElement: (fieldType: string, content: string) => void;
  onAddImage: (url: string, isBackground: boolean) => void;
  onAddRectangle?: (color: string, strokeColor: string) => void;
  onAddCircle?: (color: string, strokeColor: string) => void;
  onAddLine?: (color: string) => void;
  onAddCurvedText?: (text: string, radius: number, curve: number, flip: boolean) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Format non supporté. Utilisez JPEG, PNG ou WebP.';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `Fichier trop volumineux (${sizeMB} Mo). Taille maximale : 5 Mo.`;
  }
  return null;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({
  beerData,
  onBeerDataChange,
  onAddElement,
  onAddImage,
  onAddRectangle,
  onAddCircle,
  onAddLine,
  onAddCurvedText,
}) => {
  const [customText, setCustomText] = useState('');
  const [curvedText, setCurvedText] = useState('');
  const [curvedRadius, setCurvedRadius] = useState(150);
  const [curvedAngle, setCurvedAngle] = useState(180);
  const [curvedFlip, setCurvedFlip] = useState(false);
  const [shapeColor, setShapeColor] = useState('#d4af37');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddField = (fieldType: BeerFieldType) => {
    let content = '';
    switch (fieldType) {
      case 'breweryName':
        content = beerData.breweryName;
        break;
      case 'breweryAddress':
        content = beerData.breweryAddress;
        break;
      case 'beerName':
        content = beerData.beerName;
        break;
      case 'beerStyle':
        content = beerData.beerStyle;
        break;
      case 'alcoholDegree':
        content = `${beerData.alcoholDegree}% vol.`;
        break;
      case 'volume':
        content = `${beerData.volume} ${beerData.volumeUnit}`;
        break;
      case 'ebc':
        content = `EBC: ${beerData.ebc}`;
        break;
      case 'ibu':
        content = `IBU: ${beerData.ibu}`;
        break;
      case 'ingredients':
        content = beerData.ingredients;
        break;
      default:
        content = customText || 'Texte';
    }
    onAddElement(fieldType, content);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isBackground: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateImageFile(file);
      if (error) {
        setImageError(error);
        e.target.value = '';
        return;
      }
      setImageError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAddImage(dataUrl, isBackground);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Beer Info Section */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Informations Bière
        </h3>
        <div className="space-y-3">
          <InputField
            label="Nom de la brasserie"
            value={beerData.breweryName}
            onChange={(v) => onBeerDataChange('breweryName', v)}
            onAdd={() => handleAddField('breweryName')}
          />
          <InputField
            label="Nom de la bière"
            value={beerData.beerName}
            onChange={(v) => onBeerDataChange('beerName', v)}
            onAdd={() => handleAddField('beerName')}
          />
          <InputField
            label="Style"
            value={beerData.beerStyle}
            onChange={(v) => onBeerDataChange('beerStyle', v)}
            onAdd={() => handleAddField('beerStyle')}
          />
          <div className="grid grid-cols-4 gap-1">
            <CompactNumberField
              label="Alc.%"
              value={beerData.alcoholDegree}
              onChange={(v) => onBeerDataChange('alcoholDegree', v)}
              onAdd={() => handleAddField('alcoholDegree')}
              step={0.1}
            />
            <CompactNumberField
              label="Vol."
              value={beerData.volume}
              onChange={(v) => onBeerDataChange('volume', v)}
              onAdd={() => handleAddField('volume')}
            />
            <CompactNumberField
              label="EBC"
              value={beerData.ebc}
              onChange={(v) => onBeerDataChange('ebc', v)}
              onAdd={() => handleAddField('ebc')}
            />
            <CompactNumberField
              label="IBU"
              value={beerData.ibu}
              onChange={(v) => onBeerDataChange('ibu', v)}
              onAdd={() => handleAddField('ibu')}
            />
          </div>
          <TextAreaField
            label="Ingrédients"
            value={beerData.ingredients}
            onChange={(v) => onBeerDataChange('ingredients', v)}
            onAdd={() => handleAddField('ingredients')}
          />
          <TextAreaField
            label="Adresse"
            value={beerData.breweryAddress}
            onChange={(v) => onBeerDataChange('breweryAddress', v)}
            onAdd={() => handleAddField('breweryAddress')}
          />
        </div>
      </section>

      {/* Custom Text Section */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Texte Personnalisé
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Entrez votre texte..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => handleAddField('custom')}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors"
          >
            +
          </button>
        </div>
      </section>

      {/* Curved Text Section */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Texte Courbé
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={curvedText}
            onChange={(e) => setCurvedText(e.target.value)}
            placeholder="Texte en arc..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 w-14">Rayon</label>
            <input
              type="range"
              min="50"
              max="400"
              value={curvedRadius}
              onChange={(e) => setCurvedRadius(Number(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="text-xs text-gray-300 w-8 text-right">{curvedRadius}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 w-14">Angle</label>
            <input
              type="range"
              min="30"
              max="360"
              value={curvedAngle}
              onChange={(e) => setCurvedAngle(Number(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="text-xs text-gray-300 w-8 text-right">{curvedAngle}°</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400">Inverser la courbe</label>
            <button
              onClick={() => setCurvedFlip(!curvedFlip)}
              className={`w-10 h-5 rounded-full transition-colors ${curvedFlip ? 'bg-amber-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${curvedFlip ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button
            onClick={() => {
              if (curvedText && onAddCurvedText) {
                onAddCurvedText(curvedText, curvedRadius, curvedAngle, curvedFlip);
              }
            }}
            disabled={!curvedText}
            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Ajouter le texte courbé
          </button>
        </div>
      </section>

      {/* Images Section */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Images
        </h3>
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleImageUpload(e, false)}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
          />
          <input
            type="file"
            ref={bgFileInputRef}
            onChange={(e) => handleImageUpload(e, true)}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
          />
          {imageError && (
            <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-xs flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{imageError}</span>
              <button onClick={() => setImageError(null)} className="ml-auto text-red-400 hover:text-red-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Ajouter une image
          </button>
          <button
            onClick={() => bgFileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
            Image de fond
          </button>
        </div>
      </section>

      {/* Shapes Section */}
      <section>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
          Formes
        </h3>
        <div className="space-y-3">
          {/* Color selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Remplissage</label>
              <input
                type="color"
                value={shapeColor}
                onChange={(e) => setShapeColor(e.target.value)}
                className="w-full h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Contour</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full h-8 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
            </div>
          </div>

          {/* Shape buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onAddRectangle?.(shapeColor, strokeColor)}
              className="flex flex-col items-center gap-1 px-3 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              title="Ajouter un rectangle"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="1" strokeWidth={2} />
              </svg>
              <span className="text-xs">Rectangle</span>
            </button>
            <button
              onClick={() => onAddCircle?.(shapeColor, strokeColor)}
              className="flex flex-col items-center gap-1 px-3 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              title="Ajouter un cercle"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
              <span className="text-xs">Cercle</span>
            </button>
            <button
              onClick={() => onAddLine?.(strokeColor)}
              className="flex flex-col items-center gap-1 px-3 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              title="Ajouter une ligne"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="4" y1="20" x2="20" y2="4" strokeWidth={2} strokeLinecap="round" />
              </svg>
              <span className="text-xs">Ligne</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

// Helper Components
interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, onAdd }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <button
        onClick={onAdd}
        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors text-sm"
        title="Ajouter au canvas"
      >
        +
      </button>
    </div>
  </div>
);

// Compact number field for small values (Alcohol, Volume, EBC, IBU)
interface CompactNumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onAdd: () => void;
  step?: number;
}

const CompactNumberField: React.FC<CompactNumberFieldProps> = ({
  label,
  value,
  onChange,
  onAdd,
  step = 1,
}) => (
  <div>
    <label className="block text-[10px] text-gray-400 mb-0.5 truncate">{label}</label>
    <div className="flex flex-col gap-0.5">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
      />
      <button
        onClick={onAdd}
        className="w-full py-0.5 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors text-[10px]"
        title="Ajouter au canvas"
      >
        +
      </button>
    </div>
  </div>
);

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, value, onChange, onAdd }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <div className="flex gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />
      <button
        onClick={onAdd}
        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors text-sm self-start"
        title="Ajouter au canvas"
      >
        +
      </button>
    </div>
  </div>
);
