import { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, Code2, File } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import type { Note } from '@/types/workspace';

interface NoteExportActionsProps {
    editor: any;
    note: Note;
}

export default function NoteExportActions({ editor, note }: NoteExportActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    const handleExportMarkdown = async () => {
        const markdown = await editor.blocksToMarkdownLossy(editor.document);
        downloadFile(markdown, `${note.title || 'Untitled'}.md`, 'text/markdown');
    };

    const handleExportHTML = async () => {
        const html = await editor.blocksToHTMLLossy(editor.document);
        downloadFile(html, `${note.title || 'Untitled'}.html`, 'text/html');
    };

    const handleExportJSON = () => {
        const json = JSON.stringify(editor.document, null, 2);
        downloadFile(json, `${note.title || 'Untitled'}.json`, 'application/json');
    };

    const handleExportPDF = async () => {
        const html = await editor.blocksToHTMLLossy(editor.document);
        const element = document.createElement('div');
        element.innerHTML = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h1>${note.title || 'Untitled'}</h1>
            ${html}
          </div>
        `;

        const opt = {
            margin: 0.5,
            filename: `${note.title || 'Untitled'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(element).save();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
                <Download className="h-4 w-4" />
                <span>Export</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-900 dark:ring-white/10">
                    <button
                        onClick={handleExportMarkdown}
                        className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <FileText className="mr-3 h-4 w-4" />
                        Markdown (.md)
                    </button>
                    <button
                        onClick={handleExportHTML}
                        className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <Code2 className="mr-3 h-4 w-4" />
                        HTML (.html)
                    </button>
                    <button
                        onClick={handleExportJSON}
                        className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <FileJson className="mr-3 h-4 w-4" />
                        JSON (.json)
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <File className="mr-3 h-4 w-4" />
                        PDF (.pdf)
                    </button>
                </div>
            )}
        </div>
    );
}
