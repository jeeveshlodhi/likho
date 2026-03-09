import React from 'react';
import { LineElement } from '@/types/canvas';

export const LineRender: React.FC<{ element: LineElement; isSelected?: boolean }> = ({ element, isSelected }) => {
    const minX = Math.min(element.x, element.endX);
    const minY = Math.min(element.y, element.endY);
    const maxX = Math.max(element.x, element.endX);
    const maxY = Math.max(element.y, element.endY);
    const pad = Math.max(element.strokeWidth, 8);
    const svgW = maxX - minX + pad * 2;
    const svgH = maxY - minY + pad * 2;

    const x1 = element.x - minX + pad;
    const y1 = element.y - minY + pad;
    const x2 = element.endX - minX + pad;
    const y2 = element.endY - minY + pad;

    return (
        <svg
            style={{
                position: 'absolute',
                left: minX - pad,
                top: minY - pad,
                width: svgW,
                height: svgH,
                overflow: 'visible',
            }}
        >
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={element.strokeColor}
                strokeWidth={element.strokeWidth}
                strokeLinecap="round"
            />
            {isSelected && (
                <>
                    <circle cx={x1} cy={y1} r={4} fill="#3b82f6" />
                    <circle cx={x2} cy={y2} r={4} fill="#3b82f6" />
                </>
            )}
        </svg>
    );
};
