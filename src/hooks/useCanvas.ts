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
const SNAP_THRESHOLD = 5; // pixels - distance to snap to grid or guides
const GUIDE_COLOR = '#ff00ff'; // magenta color for smart guides

export function useCanvas({ format, scale, onSelectionChange, onObjectsChange }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [zoom, setZoom] = useState(1);

  // Grid & guides state
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10); // in pixels
  const [showSmartGuides, setShowSmartGuides] = useState(true);
  const guideLinesRef = useRef<fabric.FabricObject[]>([]);
  const snapToGridRef = useRef(snapToGrid);
  const gridSizeRef = useRef(gridSize);
  const showSmartGuidesRef = useRef(showSmartGuides);
  const scaleRef = useRef(scale);

  // Keep refs in sync with state
  useEffect(() => { snapToGridRef.current = snapToGrid; }, [snapToGrid]);
  useEffect(() => { gridSizeRef.current = gridSize; }, [gridSize]);
  useEffect(() => { showSmartGuidesRef.current = showSmartGuides; }, [showSmartGuides]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

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

  // Refs for callbacks to avoid dependency issues
  const saveHistoryRef = useRef(saveHistory);
  const notifyObjectsChangeRef = useRef(notifyObjectsChange);

  useEffect(() => {
    saveHistoryRef.current = saveHistory;
  }, [saveHistory]);

  useEffect(() => {
    notifyObjectsChangeRef.current = notifyObjectsChange;
  }, [notifyObjectsChange]);

  // --- Grid drawing ---
  const drawGrid = useCallback(() => {
    if (!fabricRef.current) return;
    // Remove existing grid lines
    const objects = fabricRef.current.getObjects();
    objects.forEach((obj) => {
      if ((obj as fabric.FabricObject & { isGrid?: boolean }).isGrid) {
        fabricRef.current!.remove(obj);
      }
    });

    if (!showGrid) {
      fabricRef.current.renderAll();
      return;
    }

    const w = fabricRef.current.getWidth();
    const h = fabricRef.current.getHeight();
    const step = gridSize * scale;

    // Vertical lines
    for (let x = step; x < w; x += step) {
      const line = new fabric.Line([x, 0, x, h], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      (line as fabric.FabricObject & { isGrid?: boolean }).isGrid = true;
      fabricRef.current.add(line);
      fabricRef.current.sendObjectToBack(line);
    }

    // Horizontal lines
    for (let y = step; y < h; y += step) {
      const line = new fabric.Line([0, y, w, y], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      (line as fabric.FabricObject & { isGrid?: boolean }).isGrid = true;
      fabricRef.current.add(line);
      fabricRef.current.sendObjectToBack(line);
    }

    fabricRef.current.renderAll();
  }, [showGrid, gridSize, scale]);

  // Redraw grid when settings change
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // --- Smart Guides helpers ---
  const clearGuideLines = useCallback(() => {
    if (!fabricRef.current) return;
    guideLinesRef.current.forEach((line) => {
      fabricRef.current!.remove(line);
    });
    guideLinesRef.current = [];
  }, []);

  const addGuideLine = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!fabricRef.current) return;
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: GUIDE_COLOR,
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (line as fabric.FabricObject & { isGuide?: boolean }).isGuide = true;
    fabricRef.current.add(line);
    guideLinesRef.current.push(line);
  }, []);

  // --- Alignment functions ---
  const alignObjects = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (!fabricRef.current) return;
    const activeObj = fabricRef.current.getActiveObject();
    if (!activeObj) return;

    // If it's a group selection (ActiveSelection), align objects within the selection
    if (activeObj instanceof fabric.ActiveSelection) {
      const objects = activeObj.getObjects();
      if (objects.length < 2) return;

      const bounds = activeObj.getBoundingRect();

      objects.forEach((obj) => {
        const objBounds = obj.getBoundingRect();
        switch (alignment) {
          case 'left':
            obj.set({ left: (obj.left || 0) + (bounds.left - objBounds.left) });
            break;
          case 'right':
            obj.set({ left: (obj.left || 0) + (bounds.left + bounds.width - objBounds.left - objBounds.width) });
            break;
          case 'center-h':
            obj.set({ left: (obj.left || 0) + (bounds.left + bounds.width / 2 - objBounds.left - objBounds.width / 2) });
            break;
          case 'top':
            obj.set({ top: (obj.top || 0) + (bounds.top - objBounds.top) });
            break;
          case 'bottom':
            obj.set({ top: (obj.top || 0) + (bounds.top + bounds.height - objBounds.top - objBounds.height) });
            break;
          case 'center-v':
            obj.set({ top: (obj.top || 0) + (bounds.top + bounds.height / 2 - objBounds.top - objBounds.height / 2) });
            break;
        }
        obj.setCoords();
      });

      activeObj.setCoords();
      fabricRef.current.renderAll();
      saveHistory();
      return;
    }

    // Single object: align to canvas
    const canvasW = fabricRef.current.getWidth();
    const canvasH = fabricRef.current.getHeight();
    const objBounds = activeObj.getBoundingRect();

    switch (alignment) {
      case 'left':
        activeObj.set({ left: (activeObj.left || 0) + (0 - objBounds.left) });
        break;
      case 'right':
        activeObj.set({ left: (activeObj.left || 0) + (canvasW - objBounds.left - objBounds.width) });
        break;
      case 'center-h':
        activeObj.set({ left: (activeObj.left || 0) + (canvasW / 2 - objBounds.left - objBounds.width / 2) });
        break;
      case 'top':
        activeObj.set({ top: (activeObj.top || 0) + (0 - objBounds.top) });
        break;
      case 'bottom':
        activeObj.set({ top: (activeObj.top || 0) + (canvasH - objBounds.top - objBounds.height) });
        break;
      case 'center-v':
        activeObj.set({ top: (activeObj.top || 0) + (canvasH / 2 - objBounds.top - objBounds.height / 2) });
        break;
    }

    activeObj.setCoords();
    fabricRef.current.renderAll();
    saveHistory();
  }, [saveHistory]);

  const distributeObjects = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!fabricRef.current) return;
    const activeObj = fabricRef.current.getActiveObject();
    if (!activeObj || !(activeObj instanceof fabric.ActiveSelection)) return;

    const objects = activeObj.getObjects();
    if (objects.length < 3) return;

    // Sort by position
    const sorted = [...objects].sort((a, b) => {
      const aB = a.getBoundingRect();
      const bB = b.getBoundingRect();
      return direction === 'horizontal' ? aB.left - bB.left : aB.top - bB.top;
    });

    const firstBounds = sorted[0].getBoundingRect();
    const lastBounds = sorted[sorted.length - 1].getBoundingRect();

    if (direction === 'horizontal') {
      const totalSpan = (lastBounds.left + lastBounds.width) - firstBounds.left;
      const totalObjWidth = sorted.reduce((sum, obj) => sum + obj.getBoundingRect().width, 0);
      const gap = (totalSpan - totalObjWidth) / (sorted.length - 1);

      let currentX = firstBounds.left + firstBounds.width + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        const objBounds = sorted[i].getBoundingRect();
        sorted[i].set({ left: (sorted[i].left || 0) + (currentX - objBounds.left) });
        sorted[i].setCoords();
        currentX += objBounds.width + gap;
      }
    } else {
      const totalSpan = (lastBounds.top + lastBounds.height) - firstBounds.top;
      const totalObjHeight = sorted.reduce((sum, obj) => sum + obj.getBoundingRect().height, 0);
      const gap = (totalSpan - totalObjHeight) / (sorted.length - 1);

      let currentY = firstBounds.top + firstBounds.height + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        const objBounds = sorted[i].getBoundingRect();
        sorted[i].set({ top: (sorted[i].top || 0) + (currentY - objBounds.top) });
        sorted[i].setCoords();
        currentY += objBounds.height + gap;
      }
    }

    activeObj.setCoords();
    fabricRef.current.renderAll();
    saveHistory();
  }, [saveHistory]);

  // Initialize canvas - only once on mount
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;

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
    initializedRef.current = true;

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
      saveHistoryRef.current();
      notifyObjectsChangeRef.current();
    });

    canvas.on('object:removed', () => {
      saveHistoryRef.current();
      notifyObjectsChangeRef.current();
    });

    canvas.on('object:modified', () => {
      saveHistoryRef.current();
      notifyObjectsChangeRef.current();
      // Clear guides after drop
      clearGuideLines();
      canvas.renderAll();
    });

    // Smart guides + snap-to-grid during object movement
    canvas.on('object:moving', (e) => {
      const target = e.target;
      if (!target) return;

      const canvasW = canvas.getWidth();
      const canvasH = canvas.getHeight();
      const bound = target.getBoundingRect();
      const threshold = SNAP_THRESHOLD;

      let newLeft = target.left || 0;
      let newTop = target.top || 0;

      // --- Snap to grid ---
      if (snapToGridRef.current) {
        const step = gridSizeRef.current * scaleRef.current;
        // Snap based on object's bounding rect top-left
        const snapX = Math.round(bound.left / step) * step;
        const snapY = Math.round(bound.top / step) * step;
        newLeft = newLeft + (snapX - bound.left);
        newTop = newTop + (snapY - bound.top);
        target.set({ left: newLeft, top: newTop });
        target.setCoords();
      }

      // --- Smart guides ---
      if (!showSmartGuidesRef.current) return;

      clearGuideLines();

      const objCenterX = bound.left + bound.width / 2;
      const objCenterY = bound.top + bound.height / 2;
      const objRight = bound.left + bound.width;
      const objBottom = bound.top + bound.height;
      const canvasCenterX = canvasW / 2;
      const canvasCenterY = canvasH / 2;

      // Snap points to check: canvas edges and center
      const snapXPoints = [
        { val: 0, label: 'canvas-left' },
        { val: canvasCenterX, label: 'canvas-center-x' },
        { val: canvasW, label: 'canvas-right' },
      ];
      const snapYPoints = [
        { val: 0, label: 'canvas-top' },
        { val: canvasCenterY, label: 'canvas-center-y' },
        { val: canvasH, label: 'canvas-bottom' },
      ];

      // Also add other objects' edges and centers as snap points
      const allObjects = canvas.getObjects().filter((obj) => {
        const asAny = obj as fabric.FabricObject & { isGrid?: boolean; isGuide?: boolean };
        return obj !== target && !asAny.isGrid && !asAny.isGuide;
      });

      allObjects.forEach((obj) => {
        const ob = obj.getBoundingRect();
        snapXPoints.push(
          { val: ob.left, label: 'obj-left' },
          { val: ob.left + ob.width / 2, label: 'obj-center-x' },
          { val: ob.left + ob.width, label: 'obj-right' }
        );
        snapYPoints.push(
          { val: ob.top, label: 'obj-top' },
          { val: ob.top + ob.height / 2, label: 'obj-center-y' },
          { val: ob.top + ob.height, label: 'obj-bottom' }
        );
      });

      // Check horizontal snapping (left edge, center, right edge of target)
      const targetXEdges = [
        { val: bound.left, type: 'left' },
        { val: objCenterX, type: 'center' },
        { val: objRight, type: 'right' },
      ];

      const targetYEdges = [
        { val: bound.top, type: 'top' },
        { val: objCenterY, type: 'center' },
        { val: objBottom, type: 'bottom' },
      ];

      let snappedX = false;
      let snappedY = false;

      for (const edge of targetXEdges) {
        if (snappedX) break;
        for (const snap of snapXPoints) {
          if (Math.abs(edge.val - snap.val) < threshold) {
            const diff = snap.val - edge.val;
            newLeft = (target.left || 0) + diff;
            target.set({ left: newLeft });
            target.setCoords();
            // Draw vertical guide line
            addGuideLine(snap.val, 0, snap.val, canvasH);
            snappedX = true;
            break;
          }
        }
      }

      for (const edge of targetYEdges) {
        if (snappedY) break;
        for (const snap of snapYPoints) {
          if (Math.abs(edge.val - snap.val) < threshold) {
            const diff = snap.val - edge.val;
            newTop = (target.top || 0) + diff;
            target.set({ top: newTop });
            target.setCoords();
            // Draw horizontal guide line
            addGuideLine(0, snap.val, canvasW, snap.val);
            snappedY = true;
            break;
          }
        }
      }

      canvas.renderAll();
    });

    // Clear guides when selection is cleared or on mouse up
    canvas.on('mouse:up', () => {
      clearGuideLines();
      canvas.renderAll();
    });

    // Save initial state
    setTimeout(() => saveHistoryRef.current(), 100);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
      initializedRef.current = false;
    };
  }, []); // Only run once on mount

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

  // Add curved text along an arc path
  const addCurvedText = useCallback((
    content: string,
    radius: number = 150,
    curve: number = 180,
    flip: boolean = false
  ) => {
    if (!fabricRef.current) return;

    const centerX = mmToPx(format.width / 2, scale);
    const centerY = mmToPx(format.height / 2, scale);
    const r = radius * scale;

    // Build an SVG arc path
    const startAngle = (180 - curve) / 2;
    const endAngle = startAngle + curve;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = r * Math.cos(startRad);
    const y1 = -r * Math.sin(startRad);
    const x2 = r * Math.cos(endRad);
    const y2 = -r * Math.sin(endRad);

    const largeArc = curve > 180 ? 1 : 0;
    const sweepFlag = flip ? 0 : 1;
    const pathStr = flip
      ? `M ${x2} ${y2} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${x1} ${y1}`
      : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${x2} ${y2}`;

    const path = new fabric.Path(pathStr, {
      fill: '',
      stroke: '',
      visible: false,
    });

    const text = new fabric.FabricText(content, {
      left: centerX,
      top: centerY,
      fontFamily: 'Playfair Display',
      fontSize: 24 * scale,
      fontWeight: 'bold',
      fill: '#000000',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      path: path,
    });

    (text as fabric.FabricObject & { elementName?: string }).elementName = 'Texte courbé';
    (text as fabric.FabricObject & { curvedText?: boolean }).curvedText = true;

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();

    saveHistory();
    notifyObjectsChange();

    return text;
  }, [format.width, format.height, scale, saveHistory, notifyObjectsChange]);

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
    if (style.opacity !== undefined) (updates as unknown as { opacity: number }).opacity = style.opacity;

    // Handle shadow separately - setting it directly works better in Fabric.js
    if (Object.prototype.hasOwnProperty.call(style, 'shadow')) {
      if (style.shadow) {
        selectedObject.set('shadow', new fabric.Shadow({
          color: style.shadow.color,
          blur: style.shadow.blur,
          offsetX: style.shadow.offsetX,
          offsetY: style.shadow.offsetY,
        }));
      } else {
        // Remove shadow by setting to null
        selectedObject.set('shadow', null);
      }
    }

    // Apply other updates
    if (Object.keys(updates).length > 0) {
      selectedObject.set(updates);
    }
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

  // Update image style (opacity and filters)
  const updateImageStyle = useCallback((props: {
    opacity?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
  }) => {
    if (!fabricRef.current || !selectedObject) return;
    if (!(selectedObject instanceof fabric.FabricImage)) return;

    const img = selectedObject as fabric.FabricImage;

    // Update opacity
    if (props.opacity !== undefined) {
      img.set({ opacity: props.opacity });
    }

    // Build filters array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any[] = [];

    // Get current filter values from image or use defaults
    const currentFilters = (img as fabric.FabricImage & { filterValues?: Record<string, number | boolean> }).filterValues || {};

    const brightness = props.brightness !== undefined ? props.brightness : (currentFilters.brightness as number ?? 0);
    const contrast = props.contrast !== undefined ? props.contrast : (currentFilters.contrast as number ?? 0);
    const saturation = props.saturation !== undefined ? props.saturation : (currentFilters.saturation as number ?? 0);
    const blur = props.blur !== undefined ? props.blur : (currentFilters.blur as number ?? 0);
    const grayscale = props.grayscale !== undefined ? props.grayscale : (currentFilters.grayscale as boolean ?? false);
    const sepia = props.sepia !== undefined ? props.sepia : (currentFilters.sepia as boolean ?? false);
    const invert = props.invert !== undefined ? props.invert : (currentFilters.invert as boolean ?? false);

    // Store filter values on image for later retrieval
    (img as fabric.FabricImage & { filterValues?: Record<string, number | boolean> }).filterValues = {
      brightness,
      contrast,
      saturation,
      blur,
      grayscale,
      sepia,
      invert,
    };

    // Add filters based on values
    if (brightness !== 0) {
      filters.push(new fabric.filters.Brightness({ brightness }));
    }
    if (contrast !== 0) {
      filters.push(new fabric.filters.Contrast({ contrast }));
    }
    if (saturation !== 0) {
      filters.push(new fabric.filters.Saturation({ saturation }));
    }
    if (blur > 0) {
      filters.push(new fabric.filters.Blur({ blur }));
    }
    if (grayscale) {
      filters.push(new fabric.filters.Grayscale());
    }
    if (sepia) {
      filters.push(new fabric.filters.Sepia());
    }
    if (invert) {
      filters.push(new fabric.filters.Invert());
    }

    img.filters = filters;
    img.applyFilters();
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

  // Zoom controls - CSS-based zoom (doesn't modify Fabric.js objects)
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 4);
    setZoom(newZoom);
  }, [zoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.2, 0.25);
    setZoom(newZoom);
  }, [zoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#ffffff';
    fabricRef.current.renderAll();
  }, []);

  // Load from JSON with scaling to fit current canvas size
  const loadFromJSON = useCallback(async (json: string) => {
    if (!fabricRef.current) return;

    // Original template dimensions (90mm x 120mm at scale ~3.78)
    const TEMPLATE_ORIGINAL_WIDTH = 340;
    const TEMPLATE_ORIGINAL_HEIGHT = 452;

    // Current canvas dimensions
    const canvasWidth = fabricRef.current.getWidth();
    const canvasHeight = fabricRef.current.getHeight();

    // Calculate scale ratios
    const scaleX = canvasWidth / TEMPLATE_ORIGINAL_WIDTH;
    const scaleY = canvasHeight / TEMPLATE_ORIGINAL_HEIGHT;
    const scaleFactor = Math.min(scaleX, scaleY);

    // Parse and transform JSON
    const data = JSON.parse(json);

    if (data.objects && Array.isArray(data.objects)) {
      data.objects = data.objects.map((obj: Record<string, unknown>) => {
        const transformed = { ...obj };

        // Scale position
        if (typeof transformed.left === 'number') {
          transformed.left = (transformed.left / TEMPLATE_ORIGINAL_WIDTH) * canvasWidth;
        }
        if (typeof transformed.top === 'number') {
          transformed.top = (transformed.top / TEMPLATE_ORIGINAL_HEIGHT) * canvasHeight;
        }

        // Scale dimensions
        if (typeof transformed.width === 'number') {
          transformed.width = transformed.width * scaleFactor;
        }
        if (typeof transformed.height === 'number') {
          transformed.height = transformed.height * scaleFactor;
        }
        if (typeof transformed.radius === 'number') {
          transformed.radius = transformed.radius * scaleFactor;
        }

        // Scale font size
        if (typeof transformed.fontSize === 'number') {
          transformed.fontSize = transformed.fontSize * scaleFactor;
        }

        // Scale stroke width
        if (typeof transformed.strokeWidth === 'number') {
          transformed.strokeWidth = transformed.strokeWidth * scaleFactor;
        }

        // Scale line coordinates
        if (typeof transformed.x1 === 'number') {
          transformed.x1 = transformed.x1 * scaleFactor;
        }
        if (typeof transformed.x2 === 'number') {
          transformed.x2 = transformed.x2 * scaleFactor;
        }
        if (typeof transformed.y1 === 'number') {
          transformed.y1 = transformed.y1 * scaleFactor;
        }
        if (typeof transformed.y2 === 'number') {
          transformed.y2 = transformed.y2 * scaleFactor;
        }

        // Scale Path objects via scaleX/scaleY
        if (transformed.type === 'Path') {
          transformed.scaleX = ((transformed.scaleX as number) || 1) * scaleFactor;
          transformed.scaleY = ((transformed.scaleY as number) || 1) * scaleFactor;
        }

        return transformed;
      });
    }

    await fabricRef.current.loadFromJSON(JSON.stringify(data));
    fabricRef.current.renderAll();
    saveHistory();
    notifyObjectsChange();
  }, [saveHistory, notifyObjectsChange]);

  // Load from JSON without scaling (for saved projects)
  const loadFromJSONRaw = useCallback(async (json: string) => {
    if (!fabricRef.current) return;

    await fabricRef.current.loadFromJSON(json);
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
    
    // Wait for fonts to be loaded, then re-render to fix font display
    document.fonts.ready.then(() => {
      if (fabricRef.current) {
        // Force re-render of all text objects to apply loaded fonts
        fabricRef.current.getObjects().forEach((obj) => {
          if (obj instanceof fabric.IText || obj instanceof fabric.Text) {
            obj.dirty = true;
          }
        });
        fabricRef.current.renderAll();
      }
    });
    
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
    // Grid & guides
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    showSmartGuides,
    setShowSmartGuides,
    // Alignment
    alignObjects,
    distributeObjects,
    // Canvas actions
    addText,
    addCurvedText,
    addRectangle,
    addCircle,
    addLine,
    addImage,
    updateSelectedStyle,
    updateShapeStyle,
    updateImageStyle,
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
    loadFromJSONRaw,
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
      shadow: (obj as fabric.IText).shadow ? {
        color: ((obj as fabric.IText).shadow as fabric.Shadow).color || 'rgba(0,0,0,0.5)',
        blur: ((obj as fabric.IText).shadow as fabric.Shadow).blur || 0,
        offsetX: ((obj as fabric.IText).shadow as fabric.Shadow).offsetX || 0,
        offsetY: ((obj as fabric.IText).shadow as fabric.Shadow).offsetY || 0,
      } : undefined,
    } : DEFAULT_ELEMENT_STYLE,
  };
}
