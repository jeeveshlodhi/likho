import { useState, useEffect } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { Note } from '@/types/workspace';

interface NoteTitleInputProps {
    note: Note;
}

export default function NoteTitleInput({ note }: NoteTitleInputProps) {
    const [localTitle, setLocalTitle] = useState(note.title);
    const save = useAutoSave(note.id);

    // Sync with global store only if the note changes externally (e.g. note switch)
    useEffect(() => {
        setLocalTitle(note.title);
    }, [note.id]); // Intentionally not depending on note.title here to avoid overriding active typing

    return (
        <input
            type="text"
            value={localTitle}
            onChange={(e) => {
                const newValue = e.target.value;
                setLocalTitle(newValue);
                save({ title: newValue });
            }}
            placeholder="Untitled"
            className="mb-4 w-full bg-transparent text-4xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300 dark:text-neutral-100 dark:placeholder:text-neutral-600"
        />
    );
}
