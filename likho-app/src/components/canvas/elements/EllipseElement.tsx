import React from 'react';
import { EllipseElement } from '@/types/canvas';

export const EllipseRender: React.FC<{ element: EllipseElement; isSelected?: boolean }> = ({ element, isSelected }) => {
    const w = Math.abs(element.width) || 1;
    const h = Math.abs(element.height) || 1;

    return (
        <svg
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: w,
                height: h,
                overflow: 'visible',
            }}
        >
            <ellipse
                cx={w / 2}
                cy={h / 2}
                rx={w / 2}
                ry={h / 2}
                fill={element.backgroundColor}
                stroke={element.strokeColor}
                strokeWidth={element.strokeWidth}
            />
            {isSelected && (
                <rect
                    x={-2}
                    y={-2}
                    width={w + 4}
                    height={h + 4}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    strokeDasharray="4"
                />
            )}
        </svg>
    );
};
