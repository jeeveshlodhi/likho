import { useState, useRef, useEffect } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  editing: boolean;
  onEditEnd: () => void;
  className?: string;
  placeholder?: string;
}

export default function InlineEdit({
  value,
  onSave,
  editing,
  onEditEnd,
  className = '',
  placeholder = 'Untitled',
}: InlineEditProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editing, value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    onEditEnd();
  }

  if (!editing) {
    return (
      <span className={`truncate ${className}`}>
        {value || placeholder}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') onEditEnd();
      }}
      className={`w-full rounded border border-blue-400 bg-white px-1 text-sm outline-none dark:bg-neutral-800 ${className}`}
    />
  );
}
