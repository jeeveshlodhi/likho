export type ElementType = 'rectangle' | 'freehand' | 'text' | 'ellipse' | 'line' | 'arrow';

export interface BaseElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    strokeColor: string;
    backgroundColor: string;
    strokeWidth: number;
}

export interface RectangleElement extends BaseElement {
    type: 'rectangle';
    borderRadius?: number;
}

export interface EllipseElement extends BaseElement {
    type: 'ellipse';
}

export interface FreehandElement extends BaseElement {
    type: 'freehand';
    points: [number, number][]; // [x, y] relative to element's top-left (x, y)
}

export interface TextElement extends BaseElement {
    type: 'text';
    text: string;
    fontSize: number;
}

export interface LineElement extends BaseElement {
    type: 'line';
    endX: number;
    endY: number;
}

export interface ArrowElement extends BaseElement {
    type: 'arrow';
    endX: number;
    endY: number;
}

export type CanvasElement = RectangleElement | FreehandElement | TextElement | EllipseElement | LineElement | ArrowElement;

export interface CameraState {
    x: number;
    y: number;
    zoom: number;
}

export interface CanvasScene {
    elements: CanvasElement[];
    camera: CameraState;
}

export type ToolType = 'select' | 'rectangle' | 'freehand' | 'text' | 'pan' | 'ellipse' | 'line' | 'arrow';

export type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface Point {
    x: number;
    y: number;
}
