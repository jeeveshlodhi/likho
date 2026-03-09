import React, { useState, useEffect, useRef } from 'react';
import { TextElement } from '@/types/canvas';

interface TextRenderProps {
    element: TextElement;
    isSelected?: boolean;
    onTextChange?: (id: string, newText: string) => void;
    onEditingChange?: (isEditing: boolean) => void;
}

export const TextRender: React.FC<TextRenderProps> = ({ element, isSelected, onTextChange, onEditingChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [textVal, setTextVal] = useState(element.text);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTextVal(element.text);
    }, [element.text]);

    useEffect(() => {
        // If it's empty and selected, automatically enter edit mode
        if (element.text === '' && isSelected && !isEditing) {
            setIsEditing(true);
            onEditingChange?.(true);
        }
    }, [element.text, isSelected]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // place cursor at end
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    }, [isEditing]);

    const handleStartEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        onEditingChange?.(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onEditingChange?.(false);
        if (onTextChange && textVal !== element.text) {
            onTextChange(element.id, textVal);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Stop propagation for ALL keys when editing to prevent canvas shortcuts
        e.stopPropagation();
        
        if (e.key === 'Escape') {
            setTextVal(element.text); // revert
            inputRef.current?.blur();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            inputRef.current?.blur();
        }
    };

    // Prevent drag pan from stopping our text input focus
    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
    };

    // Auto-resize textarea based on content
    const autoResize = (textarea: HTMLTextAreaElement) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextVal(e.target.value);
        autoResize(e.target);
    };

    return (
        <div
            ref={containerRef}
            onClick={handleStartEditing}
            onDoubleClick={handleStartEditing}
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                minWidth: 100,
                minHeight: 30,
                color: element.strokeColor,
                fontSize: element.fontSize,
                fontFamily: 'sans-serif',
                lineHeight: 1.4,
                backgroundColor: isEditing ? (element.backgroundColor || '#ffffff') : (element.backgroundColor || 'transparent'),
                borderRadius: 6,
                padding: isEditing ? '8px 12px' : '4px 8px',
                cursor: isEditing ? 'text' : 'pointer',
                boxShadow: isEditing ? '0 0 0 2px #3b82f6' : 'none',
                zIndex: isEditing ? 100 : 1,
                pointerEvents: 'auto',
            }}
        >
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    value={textVal}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onPointerDown={handlePointerDown}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'inherit',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        resize: 'both',
                        width: '100%',
                        minWidth: 100,
                        minHeight: 24,
                        padding: 0,
                        margin: 0,
                        overflow: 'hidden',
                        lineHeight: 'inherit',
                    }}
                    rows={1}
                />
            ) : (
                <div 
                    style={{ 
                        whiteSpace: 'pre-wrap', 
                        pointerEvents: 'none',
                        minHeight: 20,
                    }}
                >
                    {element.text || '\u00A0'}
                </div>
            )}

            {/* Selection border - only show when selected and NOT editing */}
            {isSelected && !isEditing && (
                <div
                    style={{
                        position: 'absolute',
                        inset: -2,
                        border: '2px solid #3b82f6',
                        pointerEvents: 'none',
                        borderRadius: 8,
                    }}
                />
            )}
        </div>
    );
};
