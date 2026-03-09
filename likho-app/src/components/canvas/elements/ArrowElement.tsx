import React from 'react';
import { ArrowElement } from '@/types/canvas';

export const ArrowRender: React.FC<{ element: ArrowElement; isSelected?: boolean }> = ({ element, isSelected }) => {
    const minX = Math.min(element.x, element.endX);
    const minY = Math.min(element.y, element.endY);
    const maxX = Math.max(element.x, element.endX);
    const maxY = Math.max(element.y, element.endY);
    const pad = Math.max(element.strokeWidth, 12);
    const svgW = maxX - minX + pad * 2;
    const svgH = maxY - minY + pad * 2;

    const x1 = element.x - minX + pad;
    const y1 = element.y - minY + pad;
    const x2 = element.endX - minX + pad;
    const y2 = element.endY - minY + pad;

    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = Math.max(10, element.strokeWidth * 4);
    const a1x = x2 - headLen * Math.cos(angle - Math.PI / 6);
    const a1y = y2 - headLen * Math.sin(angle - Math.PI / 6);
    const a2x = x2 - headLen * Math.cos(angle + Math.PI / 6);
    const a2y = y2 - headLen * Math.sin(angle + Math.PI / 6);

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
            <polygon
                points={`${x2},${y2} ${a1x},${a1y} ${a2x},${a2y}`}
                fill={element.strokeColor}
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
