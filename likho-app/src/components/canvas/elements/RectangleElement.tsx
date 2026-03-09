import React from 'react';
import { RectangleElement } from '@/types/canvas';

export const RectangleRender: React.FC<{ element: RectangleElement, isSelected?: boolean }> = ({ element, isSelected }) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                border: `${element.strokeWidth}px solid ${element.strokeColor}`,
                backgroundColor: element.backgroundColor,
                borderRadius: element.borderRadius || 0,
                boxSizing: 'border-box',
            }}
        >
            {isSelected && (
                <div
                    style={{
                        position: 'absolute',
                        inset: -4,
                        border: '1px solid #3b82f6',
                        pointerEvents: 'none',
                        borderRadius: (element.borderRadius || 0) + 4,
                    }}
                />
            )}
        </div>
    );
};
