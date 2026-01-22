import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { LabelFormat, LabelElement, BeerFieldType, ElementStyle } from '../types/label';
import { mmToPx } from '../utils/formatConverter';
import { DEFAULT_ELEMENT_STYLE, FIELD_DEFAULT_STYLES } from '../constants/defaultStyles';

interface UseCanvasOptions {
  format: LabelFormat;
  scale: number;
  onSelectionChange?: (element: LabelElement | null) => void;
  onObjectsChange?: (objects: fabric.FabricObject[]) => void;
}

const MAX_HISTORY = 50;

export function useCanvas({ format, scale, onSelectionChange, onObjectsChange }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [zoom, setZoom] = useState(1);

  // History for undo/redo
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Save state to history
  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isUndoRedoRef.current) return;

    const json = JSON.stringify(fabricRef.current.toJSON());

    // Remove any redo states
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);

    // Add new state
    historyRef.current.push(json);

    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Notify parent of objects change
  const notifyObjectsChange = useCallback(() => {
    if (onObjectsChange && fabricRef.current) {
      onObjectsChange(fabricRef.current.getObjects());
    }
  }, [onObjectsChange]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasWidth = mmToPx(format.width, scale);
    const canvasHeight = mmToPx(format.height, scale);

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Selection events
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Track modifications for history
    canvas.on('object:added', () => {
      saveHistory();
      notifyObjectsChange();
    });

    canvas.on('object:removed', () => {
      saveHistory();
      notifyObjectsChange();
    });

    canvas.on('object:modified', () => {
      saveHistory();
      notifyObjectsChange();
    });

    // Save initial state
    setTimeout(() => saveHistory(), 100);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [format.width, format.height, scale, saveHistory, notifyObjectsChange]);

  // Update canvas size when format or scale changes
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvasWidth = mmToPx(format.width, scale);
    const canvasHeight = mmToPx(format.height, scale);

    fabricRef.current.setDimensions({
      width: canvasWidth,
      height: canvasHeight,
    });
    fabricRef.current.renderAll();
  }, [format.width, format.height, scale]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      if (selectedObject) {
        const element = fabricObjectToElement(selectedObject);
        onSelectionChange(element);
      } else {
        onSelectionChange(null);
      }
    }
  }, [selectedObject, onSelectionChange]);

  // Undo
  const undo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current <= 0) return;

    isUndoRedoRef.current = true;
    historyIndexRef.current--;

    const json = historyRef.current[historyIndexRef.current];
    fabricRef.current.loadFromJSON(json).then(() => {
      fabricRef.current?.renderAll();
      isUndoRedoRef.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      notifyObjectsChange();
    });
  }, [notifyObjectsChange]);

  // Redo
  const redo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;

    isUndoRedoRef.current = true;
    historyIndexRef.current++;

    const json = historyRef.current[historyIndexRef.current];
    fabricRef.current.loadFromJSON(json).then(() => {
      fabricRef.current?.renderAll();
      isUndoRedoRef.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      notifyObjectsChange();
    });
  }, [notifyObjectsChange]);

  // Add text element
  const addText = useCallback((
    content: string,
    fieldType: BeerFieldType = 'custom',
    customStyle?: Partial<ElementStyle>
  ) => {
    if (!fabricRef.current) return;

    const baseStyle = { ...DEFAULT_ELEMENT_STYLE, ...FIELD_DEFAULT_STYLES[fieldType], ...customStyle };

    const text = new fabric.IText(content, {
      left: mmToPx(format.width / 2, scale),
      top: mmToPx(format.height / 2, scale),
      fontFamily: baseStyle.fontFamily,
      fontSize: baseStyle.fontSize * scale,
      fontWeight: baseStyle.fontWeight,
      fontStyle: baseStyle.fontStyle,
      underline: baseStyle.textDecoration === 'underline',
      fill: baseStyle.color,
      textAlign: baseStyle.textAlign,
      lineHeight: baseStyle.lineHeight,
      charSpacing: baseStyle.letterSpacing * 10,
      originX: 'center',
      originY: 'center',
    });

    // Store metadata
    (text as fabric.FabricObject & { fieldType?: BeerFieldType; elementName?: string }).fieldType = fieldType;
    (text as fabric.FabricObject & { elementName?: string }).elementName = content.substring(0, 20);

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();

    return text;
  }, [format.width, format.height, scale]);

  // Add rectangle
  const addRectangle = useCallback((color: string = '#d4af37', strokeColor: string = '#000000') => {
    if (!fabricRef.current) return;

    const rect = new fabric.Rect({
      left: mmToPx(format.width / 2, scale),
      top: mmToPx(format.height / 2, scale),
      width: 100 * scale,
      height: 60 * scale,
      fill: color,
      stroke: strokeColor,
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      rx: 0,
      ry: 0,
    });

    (rect as fabric.FabricObject & { elementName?: string }).elementName = 'Rectangle';

    fabricRef.current.add(rect);
    fabricRef.current.setActiveObject(rect);
    fabricRef.current.renderAll();

    return rect;
  }, [format.width, format.height, scale]);

  // Add circle
  const addCircle = useCallback((color: string = '#d4af37', strokeColor: string = '#000000') => {
    if (!fabricRef.current) return;

    const circle = new fabric.Circle({
      left: mmToPx(format.width / 2, scale),
      top: mmToPx(format.height / 2, scale),
      radius: 40 * scale,
      fill: color,
      stroke: strokeColor,
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
    });

    (circle as fabric.FabricObject & { elementName?: string }).elementName = 'Cercle';

    fabricRef.current.add(circle);
    fabricRef.current.setActiveObject(circle);
    fabricRef.current.renderAll();

    return circle;
  }, [format.width, format.height, scale]);

  // Add line
  const addLine = useCallback((color: string = '#000000') => {
    if (!fabricRef.current) return;

    const centerX = mmToPx(format.width / 2, scale);
    const centerY = mmToPx(format.height / 2, scale);

    const line = new fabric.Line([centerX - 50 * scale, centerY, centerX + 50 * scale, centerY], {
      stroke: color,
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
    });

    (line as fabric.FabricObject & { elementName?: string }).elementName = 'Ligne';

    fabricRef.current.add(line);
    fabricRef.current.setActiveObject(line);
    fabricRef.current.renderAll();

    return line;
  }, [format.width, format.height, scale]);

  // Add image
  const addImage = useCallback(async (url: string, isBackground: boolean = false) => {
    if (!fabricRef.current) return;

    const img = await fabric.FabricImage.fromURL(url);

    if (isBackground) {
      const canvasWidth = mmToPx(format.width, scale);
      const canvasHeight = mmToPx(format.height, scale);

      const scaleX = canvasWidth / (img.width || 1);
      const scaleY = canvasHeight / (img.height || 1);
      const imgScale = Math.max(scaleX, scaleY);

      img.set({
        scaleX: imgScale,
        scaleY: imgScale,
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
      });

      (img as fabric.FabricObject & { elementName?: string }).elementName = 'Fond';

      fabricRef.current.add(img);
      fabricRef.current.sendObjectToBack(img);
    } else {
      img.set({
        left: mmToPx(format.width / 2, scale),
        top: mmToPx(format.height / 2, scale),
        originX: 'center',
        originY: 'center',
        scaleX: 0.5,
        scaleY: 0.5,
      });

      (img as fabric.FabricObject & { elementName?: string }).elementName = 'Image';

      fabricRef.current.add(img);
      fabricRef.current.setActiveObject(img);
    }

    fabricRef.current.renderAll();
    return img;
  }, [format.width, format.height, scale]);

  // Update selected object style
  const updateSelectedStyle = useCallback((style: Partial<ElementStyle>) => {
    if (!fabricRef.current || !selectedObject) return;

    const updates: Partial<fabric.IText> = {};

    if (style.fontFamily !== undefined) updates.fontFamily = style.fontFamily;
    if (style.fontSize !== undefined) updates.fontSize = style.fontSize * scale;
    if (style.fontWeight !== undefined) updates.fontWeight = style.fontWeight;
    if (style.fontStyle !== undefined) updates.fontStyle = style.fontStyle;
    if (style.textDecoration !== undefined) updates.underline = style.textDecoration === 'underline';
    if (style.color !== undefined) updates.fill = style.color;
    if (style.textAlign !== undefined) updates.textAlign = style.textAlign;
    if (style.lineHeight !== undefined) updates.lineHeight = style.lineHeight;
    if (style.letterSpacing !== undefined) updates.charSpacing = style.letterSpacing * 10;

    selectedObject.set(updates);
    fabricRef.current.renderAll();
    saveHistory();
  }, [selectedObject, scale, saveHistory]);

  // Update shape properties
  const updateShapeStyle = useCallback((props: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    rx?: number;
    ry?: number;
  }) => {
    if (!fabricRef.current || !selectedObject) return;

    selectedObject.set(props);
    fabricRef.current.renderAll();
    saveHistory();
  }, [selectedObject, saveHistory]);

  // Delete selected object
  const deleteSelected = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;

    fabricRef.current.remove(selectedObject);
    fabricRef.current.renderAll();
    setSelectedObject(null);
  }, [selectedObject]);

  // Duplicate selected object
  const duplicateSelected = useCallback(async () => {
    if (!fabricRef.current || !selectedObject) return;

    const cloned = await selectedObject.clone();
    cloned.set({
      left: (cloned.left || 0) + 20,
      top: (cloned.top || 0) + 20,
    });

    fabricRef.current.add(cloned);
    fabricRef.current.setActiveObject(cloned);
    fabricRef.current.renderAll();

    return cloned;
  }, [selectedObject]);

  // Layer management
  const bringToFront = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.bringObjectToFront(selectedObject);
    fabricRef.current.renderAll();
    saveHistory();
    notifyObjectsChange();
  }, [selectedObject, saveHistory, notifyObjectsChange]);

  const sendToBack = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.sendObjectToBack(selectedObject);
    fabricRef.current.renderAll();
    saveHistory();
    notifyObjectsChange();
  }, [selectedObject, saveHistory, notifyObjectsChange]);

  const bringForward = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.bringObjectForward(selectedObject);
    fabricRef.current.renderAll();
    saveHistory();
    notifyObjectsChange();
  }, [selectedObject, saveHistory, notifyObjectsChange]);

  const sendBackward = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.sendObjectBackwards(selectedObject);
    fabricRef.current.renderAll();
    saveHistory();
    notifyObjectsChange();
  }, [selectedObject, saveHistory, notifyObjectsChange]);

  // Select object by reference
  const selectObject = useCallback((obj: fabric.FabricObject) => {
    if (!fabricRef.current) return;
    fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll();
  }, []);

  // Get all objects
  const getObjects = useCallback(() => {
    if (!fabricRef.current) return [];
    return fabricRef.current.getObjects();
  }, []);

  // Get canvas as data URL for export
  const toDataURL = useCallback((multiplier: number = 1) => {
    if (!fabricRef.current) return '';

    return fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier,
    });
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!fabricRef.current) return;
    const newZoom = Math.min(zoom * 1.2, 4);
    setZoom(newZoom);
    fabricRef.current.setZoom(newZoom);
    fabricRef.current.renderAll();
  }, [zoom]);

  const zoomOut = useCallback(() => {
    if (!fabricRef.current) return;
    const newZoom = Math.max(zoom / 1.2, 0.25);
    setZoom(newZoom);
    fabricRef.current.setZoom(newZoom);
    fabricRef.current.renderAll();
  }, [zoom]);

  const resetZoom = useCallback(() => {
    if (!fabricRef.current) return;
    setZoom(1);
    fabricRef.current.setZoom(1);
    fabricRef.current.renderAll();
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#ffffff';
    fabricRef.current.renderAll();
  }, []);

  // Load from JSON
  const loadFromJSON = useCallback(async (json: string) => {
    if (!fabricRef.current) return;
    await fabricRef.current.loadFromJSON(json);
    fabricRef.current.renderAll();
    saveHistory();
    notifyObjectsChange();
  }, [saveHistory, notifyObjectsChange]);

  // Export to JSON
  const toJSON = useCallback(() => {
    if (!fabricRef.current) return '';
    return JSON.stringify(fabricRef.current.toJSON());
  }, []);

  return {
    canvasRef,
    fabricRef,
    selectedObject,
    zoom,
    canUndo,
    canRedo,
    addText,
    addRectangle,
    addCircle,
    addLine,
    addImage,
    updateSelectedStyle,
    updateShapeStyle,
    deleteSelected,
    duplicateSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    selectObject,
    getObjects,
    toDataURL,
    zoomIn,
    zoomOut,
    resetZoom,
    undo,
    redo,
    clearCanvas,
    loadFromJSON,
    toJSON,
  };
}

// Helper to convert Fabric object to LabelElement
function fabricObjectToElement(obj: fabric.FabricObject): LabelElement {
  const isText = obj instanceof fabric.IText || obj instanceof fabric.Text;

  return {
    id: (obj as { id?: string }).id || Math.random().toString(36).substr(2, 9),
    type: isText ? 'text' : 'image',
    fieldType: (obj as { fieldType?: BeerFieldType }).fieldType || 'custom',
    x: obj.left || 0,
    y: obj.top || 0,
    width: obj.width,
    height: obj.height,
    rotation: obj.angle || 0,
    content: isText ? (obj as fabric.IText).text || '' : '',
    style: isText ? {
      fontFamily: (obj as fabric.IText).fontFamily || 'Roboto',
      fontSize: ((obj as fabric.IText).fontSize || 14),
      fontWeight: (obj as fabric.IText).fontWeight === 'bold' ? 'bold' : 'normal',
      fontStyle: (obj as fabric.IText).fontStyle === 'italic' ? 'italic' : 'normal',
      textDecoration: (obj as fabric.IText).underline ? 'underline' : 'none',
      color: String((obj as fabric.IText).fill || '#000000'),
      textAlign: ((obj as fabric.IText).textAlign || 'left') as 'left' | 'center' | 'right',
      lineHeight: (obj as fabric.IText).lineHeight || 1.2,
      letterSpacing: ((obj as fabric.IText).charSpacing || 0) / 10,
    } : DEFAULT_ELEMENT_STYLE,
  };
}
