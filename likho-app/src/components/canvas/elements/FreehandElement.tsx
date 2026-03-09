import React from 'react';
import { FreehandElement } from '@/types/canvas';

function getSvgPathFromPoints(points: [number, number][]) {
    if (points.length === 0) return '';
    const d = points.reduce(
        (acc, point, index) =>
            `${acc} ${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`,
        ''
    );
    return d;
}

export const FreehandRender: React.FC<{ element: FreehandElement, isSelected?: boolean }> = ({ element, isSelected }) => {
    return (
        <svg
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width || 1, // fallback to avoid 0x0
                height: element.height || 1,
                overflow: 'visible',
            }}
        >
            <path
                d={getSvgPathFromPoints(element.points)}
                fill="none"
                stroke={element.strokeColor}
                strokeWidth={element.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {isSelected && (
                <rect
                    x={-4}
                    y={-4}
                    width={(element.width || 1) + 8}
                    height={(element.height || 1) + 8}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    rx={4}
                />
            )}
        </svg>
    );
};
