import React, { useState, useEffect, useRef } from 'react';
import { TextElement } from '@/types/canvas';

interface TextRenderProps {
    element: TextElement;
    isSelected?: boolean;
    onTextChange?: (id: string, newText: string) => void;
}

export const TextRender: React.FC<TextRenderProps> = ({ element, isSelected, onTextChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [textVal, setTextVal] = useState(element.text);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // If it's empty, automatically enter edit mode initially
        if (element.text === '' && isSelected) {
            setIsEditing(true);
        }
    }, [element.text, isSelected]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // place cursor at end
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (onTextChange && textVal !== element.text) {
            onTextChange(element.id, textVal);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
            e.stopPropagation();
            inputRef.current?.blur();
        }
    };

    // Prevent drag pan from stopping our text input focus
    const handlePointerDown = (e: React.PointerEvent) => {
        if (isEditing) {
            e.stopPropagation();
        }
    };

    return (
        <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                minWidth: 50,
                minHeight: 24,
                color: element.strokeColor,
                // Using font zoom scale allows text to natively crisp
                fontSize: element.fontSize,
                fontFamily: 'sans-serif',
                lineHeight: 1.2,
            }}
        >
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onPointerDown={handlePointerDown}
                    style={{
                        background: 'transparent',
                        border: '1px solid blue',
                        outline: 'none',
                        color: 'inherit',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        resize: 'none',
                        minWidth: Math.max(100, textVal.length * element.fontSize * 0.6),
                        height: Math.max(element.fontSize * 1.5, textVal.split('\n').length * element.fontSize * 1.3),
                        padding: 0,
                        margin: -1, // offset border visual
                        overflow: 'hidden',
                    }}
                />
            ) : (
                <div style={{ whiteSpace: 'pre-wrap', pointerEvents: isSelected ? 'auto' : 'none' }}>
                    {element.text || ' '}
                </div>
            )}

            {isSelected && !isEditing && (
                <div
                    style={{
                        position: 'absolute',
                        inset: -4,
                        border: '1px solid blue',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
};
