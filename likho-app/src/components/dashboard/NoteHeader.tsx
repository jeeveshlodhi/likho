import React, { useRef, useState } from 'react';
import { Image, Smile, Trash2 } from 'lucide-react';
import type { Note } from '@/types/workspace';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface NoteHeaderProps {
    note: Note;
}

export default function NoteHeader({ note }: NoteHeaderProps) {
    const { updateNote } = useWorkspaceStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image too large. Please select an image under 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                updateNote(note.id, { coverImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeCoverImage = () => {
        updateNote(note.id, { coverImage: undefined });
    };

    const handleIconSelect = () => {
        // In a full implementation, this could open a full emoji picker.
        // For now, we'll cycle through a few simple emojis.
        const emojis = ['📝', '🚀', '💡', '🎉', '🔥', '✨', '📚', '🎯'];
        const currentIndex = note.icon ? emojis.indexOf(note.icon) : -1;
        const nextIndex = (currentIndex + 1) % emojis.length;
        updateNote(note.id, { icon: emojis[nextIndex] });
    };

    const removeIcon = () => {
        updateNote(note.id, { icon: null });
    };

    return (
        <div
            className="group relative flex flex-col w-full"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Cover Image Area */}
            {note.coverImage && (
                <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
                    <img
                        src={note.coverImage}
                        alt="Cover"
                        className="h-full w-full object-cover"
                    />
                    {isHovering && (
                        <div className="absolute top-4 right-4 flex space-x-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 rounded-md bg-white/80 px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-900"
                            >
                                <Image className="h-4 w-4" />
                                <span>Change cover</span>
                            </button>
                            <button
                                onClick={removeCoverImage}
                                className="flex items-center space-x-2 rounded-md bg-white/80 px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-neutral-900/80 dark:text-red-400 dark:hover:bg-neutral-900"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            {/* Content Area with Icon and Buttons */}
            <div className={`relative px-4 sm:px-8 ${note.coverImage ? '-mt-10 mb-4' : 'mt-4 mb-2'}`}>

                {/* Icon */}
                {note.icon && (
                    <div className="group/icon relative inline-block">
                        <button
                            onClick={handleIconSelect}
                            className={`flex h-[72px] w-[72px] items-center justify-center rounded-xl text-5xl shadow-sm transition-transform hover:scale-105 backdrop-blur ${note.coverImage ? 'bg-white dark:bg-neutral-900 shadow-md' : 'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-none'}`}
                        >
                            {note.icon}
                        </button>
                        <button
                            onClick={removeIcon}
                            className="absolute -right-2 -top-2 hidden rounded-full bg-neutral-100 p-1 text-neutral-500 shadow-sm transition-colors hover:bg-neutral-200 hover:text-red-500 group-hover/icon:block dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                )}

                {/* Action Buttons (Visible on hover when items are missing) */}
                {(!note.icon || !note.coverImage) && (
                    <div
                        className={`flex items-center space-x-4 transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'} ${note.icon ? 'mt-4' : ''}`}
                    >
                        {!note.icon && (
                            <button
                                onClick={handleIconSelect}
                                className="flex items-center space-x-2 rounded-md px-2 py-1 text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                            >
                                <Smile className="h-4 w-4" />
                                <span>Add icon</span>
                            </button>
                        )}

                        {!note.coverImage && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 rounded-md px-2 py-1 text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                            >
                                <Image className="h-4 w-4" />
                                <span>Add cover</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

