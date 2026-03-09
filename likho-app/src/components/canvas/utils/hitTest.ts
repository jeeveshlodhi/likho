import { CanvasElement, Point } from '@/types/canvas';

function distToSegmentSquared(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return (px - ax) ** 2 + (py - ay) ** 2;
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    return (px - projX) ** 2 + (py - projY) ** 2;
}

export function pointInRect(px: number, py: number, x: number, y: number, w: number, h: number): boolean {
    return px >= x && px <= x + w && py >= y && py <= y + h;
}

export function pointInEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number): boolean {
    if (rx === 0 || ry === 0) return false;
    return ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2) <= 1;
}

export function pointNearPath(px: number, py: number, points: [number, number][], originX: number, originY: number, tolerance: number): boolean {
    const tolSq = tolerance * tolerance;
    for (let i = 1; i < points.length; i++) {
        const ax = points[i - 1][0] + originX;
        const ay = points[i - 1][1] + originY;
        const bx = points[i][0] + originX;
        const by = points[i][1] + originY;
        if (distToSegmentSquared(px, py, ax, ay, bx, by) < tolSq) return true;
    }
    return false;
}

export function pointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
    return distToSegmentSquared(px, py, x1, y1, x2, y2) < tolerance * tolerance;
}

export function hitTestElements(pos: Point, elements: CanvasElement[], zoom: number): string | null {
    const tolerance = 8 / zoom;
    // Iterate reverse for top-most first
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        switch (el.type) {
            case 'rectangle':
                if (pointInRect(pos.x, pos.y, el.x, el.y, el.width, el.height)) return el.id;
                break;
            case 'ellipse': {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                // Hit test with a slightly larger ellipse for easier selection
                if (pointInEllipse(pos.x, pos.y, cx, cy, el.width / 2 + tolerance, el.height / 2 + tolerance)) return el.id;
                break;
            }
            case 'freehand':
                // First check bounding box, then detailed path check
                if (pointInRect(pos.x, pos.y, el.x - tolerance, el.y - tolerance, el.width + tolerance * 2, el.height + tolerance * 2)) {
                    if (pointNearPath(pos.x, pos.y, el.points, el.x, el.y, tolerance)) return el.id;
                }
                break;
            case 'text':
                if (pointInRect(pos.x, pos.y, el.x, el.y, Math.max(el.width, 50), Math.max(el.height, 24))) return el.id;
                break;
            case 'line':
            case 'arrow':
                if (pointNearLine(pos.x, pos.y, el.x, el.y, el.endX, el.endY, tolerance)) return el.id;
                break;
        }
    }
    return null;
}

export function getElementBounds(el: CanvasElement): { x: number; y: number; width: number; height: number } {
    if (el.type === 'line' || el.type === 'arrow') {
        const minX = Math.min(el.x, el.endX);
        const minY = Math.min(el.y, el.endY);
        const maxX = Math.max(el.x, el.endX);
        const maxY = Math.max(el.y, el.endY);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return { x: el.x, y: el.y, width: el.width, height: el.height };
}
