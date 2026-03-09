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
                    x={-2}
                    y={-2}
                    width={(element.width || 1) + 4}
                    height={(element.height || 1) + 4}
                    fill="none"
                    stroke="blue"
                    strokeWidth={1}
                    strokeDasharray="4"
                />
            )}
        </svg>
    );
};
