import React, { useState, useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { LabelElement, ElementStyle, ShadowStyle } from '../../types/label';
import { GOOGLE_FONTS } from '../../constants/defaultStyles';

interface ImageStyleProps {
  opacity?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
}

const DEFAULT_IMAGE_VALUES: ImageStyleProps = {
  opacity: 1,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  grayscale: false,
  sepia: false,
  invert: false,
};

interface CurveOptions {
  enabled: boolean;
  radius?: number;
  curve?: number;
  flip?: boolean;
}

interface StylePanelProps {
  selectedElement: LabelElement | null;
  selectedFabricObject?: fabric.FabricObject | null;
  onStyleChange: (style: Partial<ElementStyle>) => void;
  onImageStyleChange?: (props: ImageStyleProps) => void;
  onCurveChange?: (options: CurveOptions) => void;
  onDeleteElement: () => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  selectedElement,
  selectedFabricObject,
  onStyleChange,
  onImageStyleChange,
  onCurveChange,
  onDeleteElement,
}) => {
  // Check if selected object is an image
  const isImage = selectedFabricObject instanceof fabric.FabricImage;

  // Local state for image values to ensure UI updates
  const [imageValues, setImageValues] = useState<ImageStyleProps>(DEFAULT_IMAGE_VALUES);

  // Local state for text style values to ensure smooth UI updates
  const [textStyle, setTextStyle] = useState({
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: 'normal' as 'normal' | 'bold',
    fontStyle: 'normal' as 'normal' | 'italic',
    textDecoration: 'none' as 'none' | 'underline',
    color: '#000000',
    lineHeight: 1.2,
    letterSpacing: 0,
    opacity: 1,
  });

  // Local state for shadow values to ensure smooth slider animations
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowValues, setShadowValues] = useState<ShadowStyle>({
    color: '#000000',
    blur: 4,
    offsetX: 2,
    offsetY: 2,
  });

  // Local state for curve values
  const [curveEnabled, setCurveEnabled] = useState(false);
  const [curveRadius, setCurveRadius] = useState(150);
  const [curveAngle, setCurveAngle] = useState(180);
  const [curveFlip, setCurveFlip] = useState(false);

  // Track previous element ID to only sync when selection changes
  const prevElementIdRef = useRef<string | null>(null);

  // Sync text style and shadow state only when a NEW element is selected
  useEffect(() => {
    const currentId = selectedElement?.id ?? null;
    if (currentId !== prevElementIdRef.current) {
      prevElementIdRef.current = currentId;

      // Sync text styles
      if (selectedElement?.style) {
        setTextStyle({
          fontFamily: selectedElement.style.fontFamily,
          fontSize: selectedElement.style.fontSize,
          fontWeight: selectedElement.style.fontWeight,
          fontStyle: selectedElement.style.fontStyle,
          textDecoration: selectedElement.style.textDecoration,
          color: selectedElement.style.color,
          lineHeight: selectedElement.style.lineHeight,
          letterSpacing: selectedElement.style.letterSpacing,
          opacity: selectedElement.style.opacity ?? 1,
        });
      }

      // Sync shadow
      if (selectedElement?.style.shadow) {
        setShadowEnabled(true);
        setShadowValues(selectedElement.style.shadow);
      } else {
        setShadowEnabled(false);
        setShadowValues({ color: '#000000', blur: 4, offsetX: 2, offsetY: 2 });
      }

      // Sync curve
      if (selectedElement?.curveEnabled) {
        setCurveEnabled(true);
        setCurveRadius(selectedElement.curveRadius ?? 150);
        setCurveAngle(selectedElement.curveAngle ?? 180);
        setCurveFlip(selectedElement.curveFlip ?? false);
      } else {
        setCurveEnabled(false);
        setCurveRadius(150);
        setCurveAngle(180);
        setCurveFlip(false);
      }
    }
  }, [selectedElement]);

  // Handle text style change - update local state and call parent handler
  const handleTextStyleChange = (updates: Partial<typeof textStyle>) => {
    setTextStyle(prev => ({ ...prev, ...updates }));
    onStyleChange(updates);
  };

  // Track previous Fabric object to only sync when selection changes
  const prevFabricObjectRef = useRef<fabric.FabricObject | null>(null);

  // Sync local state with Fabric object only when a NEW object is selected
  useEffect(() => {
    if (selectedFabricObject !== prevFabricObjectRef.current) {
      prevFabricObjectRef.current = selectedFabricObject ?? null;
      if (isImage && selectedFabricObject) {
        const img = selectedFabricObject as fabric.FabricImage & { filterValues?: Record<string, number | boolean> };
        const filterValues = img.filterValues || {};
        setImageValues({
          opacity: img.opacity ?? 1,
          brightness: (filterValues.brightness as number) ?? 0,
          contrast: (filterValues.contrast as number) ?? 0,
          saturation: (filterValues.saturation as number) ?? 0,
          blur: (filterValues.blur as number) ?? 0,
          grayscale: (filterValues.grayscale as boolean) ?? false,
          sepia: (filterValues.sepia as boolean) ?? false,
          invert: (filterValues.invert as boolean) ?? false,
        });
      } else {
        setImageValues(DEFAULT_IMAGE_VALUES);
      }
    }
  }, [selectedFabricObject, isImage]);

  // Handle shadow style change - update local state and call parent handler
  const handleShadowChange = (updates: Partial<ShadowStyle>) => {
    const newValues = { ...shadowValues, ...updates };
    setShadowValues(newValues);
    onStyleChange({ shadow: newValues });
  };

  // Toggle shadow on/off
  const toggleShadow = () => {
    if (shadowEnabled) {
      setShadowEnabled(false);
      onStyleChange({ shadow: undefined });
    } else {
      setShadowEnabled(true);
      onStyleChange({ shadow: shadowValues });
    }
  };

  // Handle curve change - update local state and call parent handler
  const handleCurveToggle = () => {
    const newEnabled = !curveEnabled;
    setCurveEnabled(newEnabled);
    if (onCurveChange) {
      onCurveChange({
        enabled: newEnabled,
        radius: curveRadius,
        curve: curveAngle,
        flip: curveFlip,
      });
    }
  };

  const handleCurveParamChange = (updates: { radius?: number; curve?: number; flip?: boolean }) => {
    if (updates.radius !== undefined) setCurveRadius(updates.radius);
    if (updates.curve !== undefined) setCurveAngle(updates.curve);
    if (updates.flip !== undefined) setCurveFlip(updates.flip);
    if (onCurveChange) {
      onCurveChange({
        enabled: true,
        radius: updates.radius ?? curveRadius,
        curve: updates.curve ?? curveAngle,
        flip: updates.flip ?? curveFlip,
      });
    }
  };

  // Handle image style change - update local state and call parent handler
  const handleImageStyleChange = (props: ImageStyleProps) => {
    const newValues = { ...imageValues, ...props };
    setImageValues(newValues);
    if (onImageStyleChange) {
      onImageStyleChange(props);
    }
  };

  // Check if this is a multiple selection
  const isMultipleSelection = selectedElement?.id === 'multiple-selection';
  
  // Check if multiple selection contains text objects
  const multipleSelectionHasText = isMultipleSelection && selectedFabricObject instanceof fabric.ActiveSelection
    ? selectedFabricObject.getObjects().some(obj => obj instanceof fabric.IText || obj instanceof fabric.Text)
    : false;
  
  // Check if multiple selection contains images
  const multipleSelectionHasImages = isMultipleSelection && selectedFabricObject instanceof fabric.ActiveSelection
    ? selectedFabricObject.getObjects().some(obj => obj instanceof fabric.FabricImage)
    : false;

  if (!selectedElement && !isImage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p className="text-center">
          Sélectionnez un élément<br />
          <span className="text-sm">pour modifier son style</span>
        </p>
      </div>
    );
  }

  const isText = selectedElement?.type === 'text' || multipleSelectionHasText;

  // Get element name for display
  const getElementName = () => {
    if (isMultipleSelection) {
      return 'Sélection multiple';
    }
    if (isImage) {
      const img = selectedFabricObject as fabric.FabricObject & { elementName?: string };
      return img.elementName || 'Image';
    }
    return isText ? 'Texte' : 'Élément';
  };

  return (
    <div className="space-y-6">
      {/* Element Info */}
      <section className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              {getElementName()}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-[180px]">
              {selectedElement?.content || (isImage ? 'Image' : 'Sans contenu')}
            </p>
          </div>
          <button
            onClick={onDeleteElement}
            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
            title="Supprimer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </section>

      {isText && (
        <>
          {/* Font Family */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Police
            </h3>
            <select
              value={textStyle.fontFamily}
              onChange={(e) => handleTextStyleChange({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ fontFamily: textStyle.fontFamily }}
            >
              {GOOGLE_FONTS.map((font, index) => (
                <option
                  key={font.value || `separator-${index}`}
                  value={font.value}
                  disabled={font.disabled}
                  style={{
                    fontFamily: font.disabled ? 'inherit' : font.value,
                    fontWeight: font.disabled ? 'bold' : 'normal',
                    backgroundColor: font.disabled ? '#374151' : 'inherit',
                    color: font.disabled ? '#9ca3af' : 'inherit',
                  }}
                >
                  {font.name}
                </option>
              ))}
            </select>
          </section>

          {/* Font Size */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Taille
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={textStyle.fontSize}
                onChange={(e) => handleTextStyleChange({ fontSize: parseInt(e.target.value) })}
                min={6}
                max={72}
                className="flex-1 accent-amber-500"
              />
              <input
                type="number"
                value={textStyle.fontSize}
                onChange={(e) => handleTextStyleChange({ fontSize: parseInt(e.target.value) || 12 })}
                min={6}
                max={200}
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </section>

          {/* Font Style */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Style de police
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleTextStyleChange({
                  fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold'
                })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors font-bold ${
                  textStyle.fontWeight === 'bold'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                B
              </button>
              <button
                onClick={() => handleTextStyleChange({
                  fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic'
                })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors italic ${
                  textStyle.fontStyle === 'italic'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                I
              </button>
              <button
                onClick={() => handleTextStyleChange({
                  textDecoration: textStyle.textDecoration === 'underline' ? 'none' : 'underline'
                })}
                className={`flex-1 px-3 py-2 rounded-md transition-colors underline ${
                  textStyle.textDecoration === 'underline'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                U
              </button>
            </div>
          </section>

          {/* Color */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Couleur
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={textStyle.color}
                onChange={(e) => handleTextStyleChange({ color: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={textStyle.color}
                onChange={(e) => handleTextStyleChange({ color: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>
            {/* Quick Colors */}
            <div className="flex gap-2 mt-3">
              {['#000000', '#ffffff', '#d4af37', '#8b4513', '#228b22', '#1e3a5f'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleTextStyleChange({ color })}
                  className="w-8 h-8 rounded border-2 border-gray-600 hover:border-amber-500 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </section>

          {/* Line Height & Letter Spacing */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Espacement
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Interligne</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={textStyle.lineHeight}
                    onChange={(e) => handleTextStyleChange({ lineHeight: parseFloat(e.target.value) })}
                    min={0.8}
                    max={3}
                    step={0.1}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {textStyle.lineHeight.toFixed(1)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Espacement lettres</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={textStyle.letterSpacing}
                    onChange={(e) => handleTextStyleChange({ letterSpacing: parseInt(e.target.value) })}
                    min={-5}
                    max={20}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {textStyle.letterSpacing}px
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Opacity */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Opacité
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={textStyle.opacity}
                onChange={(e) => handleTextStyleChange({ opacity: parseFloat(e.target.value) })}
                min={0}
                max={1}
                step={0.05}
                className="flex-1 accent-amber-500"
              />
              <span className="w-12 text-center text-sm text-gray-300">
                {Math.round(textStyle.opacity * 100)}%
              </span>
            </div>
          </section>

          {/* Shadow */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Ombre
            </h3>
            <div className="space-y-3">
              {/* Toggle shadow */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Activer l'ombre</label>
                <button
                  onClick={toggleShadow}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    shadowEnabled ? 'bg-amber-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      shadowEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {shadowEnabled && (
                <>
                  {/* Shadow color */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Couleur</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shadowValues.color.startsWith('rgba') ? '#000000' : shadowValues.color}
                        onChange={(e) => handleShadowChange({ color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <div className="flex gap-1">
                        {['#000000', '#333333', '#666666', '#d4af37'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleShadowChange({ color })}
                            className="w-6 h-6 rounded border border-gray-600 hover:border-amber-500 transition-colors"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Blur */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Flou</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={shadowValues.blur}
                        onChange={(e) => handleShadowChange({ blur: parseInt(e.target.value) })}
                        min={0}
                        max={20}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="w-12 text-center text-sm text-gray-300">
                        {shadowValues.blur}px
                      </span>
                    </div>
                  </div>

                  {/* Offset X */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Décalage X</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={shadowValues.offsetX}
                        onChange={(e) => handleShadowChange({ offsetX: parseInt(e.target.value) })}
                        min={-20}
                        max={20}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="w-12 text-center text-sm text-gray-300">
                        {shadowValues.offsetX}px
                      </span>
                    </div>
                  </div>

                  {/* Offset Y */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Décalage Y</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={shadowValues.offsetY}
                        onChange={(e) => handleShadowChange({ offsetY: parseInt(e.target.value) })}
                        min={-20}
                        max={20}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="w-12 text-center text-sm text-gray-300">
                        {shadowValues.offsetY}px
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Curve - only for single text selection */}
          {!isMultipleSelection && (
            <section>
              <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
                Courbe
              </h3>
              <div className="space-y-3">
                {/* Toggle curve */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Activer la courbe</label>
                  <button
                    onClick={handleCurveToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      curveEnabled ? 'bg-amber-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        curveEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {curveEnabled && (
                  <>
                    {/* Radius */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Rayon</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          value={curveRadius}
                          onChange={(e) => handleCurveParamChange({ radius: parseInt(e.target.value) })}
                          min={50}
                          max={400}
                          className="flex-1 accent-amber-500"
                        />
                        <span className="w-12 text-center text-sm text-gray-300">
                          {curveRadius}
                        </span>
                      </div>
                    </div>

                    {/* Angle */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Angle</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          value={curveAngle}
                          onChange={(e) => handleCurveParamChange({ curve: parseInt(e.target.value) })}
                          min={30}
                          max={360}
                          className="flex-1 accent-amber-500"
                        />
                        <span className="w-12 text-center text-sm text-gray-300">
                          {curveAngle}°
                        </span>
                      </div>
                    </div>

                    {/* Flip */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Inverser la courbe</label>
                      <button
                        onClick={() => handleCurveParamChange({ flip: !curveFlip })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          curveFlip ? 'bg-amber-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            curveFlip ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* Image Controls */}
      {(isImage || multipleSelectionHasImages) && (
        <>
          {/* Opacity */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Opacité
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={imageValues.opacity}
                onChange={(e) => handleImageStyleChange({ opacity: parseFloat(e.target.value) })}
                min={0}
                max={1}
                step={0.05}
                className="flex-1 accent-amber-500"
              />
              <span className="w-12 text-center text-sm text-gray-300">
                {Math.round((imageValues.opacity ?? 1) * 100)}%
              </span>
            </div>
          </section>

          {/* Brightness & Contrast */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Luminosité & Contraste
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Luminosité</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={imageValues.brightness}
                    onChange={(e) => handleImageStyleChange({ brightness: parseFloat(e.target.value) })}
                    min={-1}
                    max={1}
                    step={0.05}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {Math.round((imageValues.brightness ?? 0) * 100)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Contraste</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={imageValues.contrast}
                    onChange={(e) => handleImageStyleChange({ contrast: parseFloat(e.target.value) })}
                    min={-1}
                    max={1}
                    step={0.05}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {Math.round((imageValues.contrast ?? 0) * 100)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Saturation & Blur */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Saturation & Flou
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Saturation</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={imageValues.saturation}
                    onChange={(e) => handleImageStyleChange({ saturation: parseFloat(e.target.value) })}
                    min={-1}
                    max={1}
                    step={0.05}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {Math.round((imageValues.saturation ?? 0) * 100)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Flou</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={imageValues.blur}
                    onChange={(e) => handleImageStyleChange({ blur: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                    step={0.02}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center text-sm text-gray-300">
                    {Math.round((imageValues.blur ?? 0) * 100)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Filter Effects */}
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
              Effets
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleImageStyleChange({ grayscale: !imageValues.grayscale })}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  imageValues.grayscale
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                N&B
              </button>
              <button
                onClick={() => handleImageStyleChange({ sepia: !imageValues.sepia })}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  imageValues.sepia
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sépia
              </button>
              <button
                onClick={() => handleImageStyleChange({ invert: !imageValues.invert })}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  imageValues.invert
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Inverser
              </button>
            </div>
          </section>

          {/* Reset Filters */}
          <section>
            <button
              onClick={() => handleImageStyleChange({
                opacity: 1,
                brightness: 0,
                contrast: 0,
                saturation: 0,
                blur: 0,
                grayscale: false,
                sepia: false,
                invert: false,
              })}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
            >
              Réinitialiser les filtres
            </button>
          </section>
        </>
      )}
    </div>
  );
};
