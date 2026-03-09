import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps, createBlockConfig } from "@blocknote/core";
import { Link2, AlertCircle } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useLinkStore } from "@/store/linkStore";
import { useNavigate } from "react-router";

export const CreateWikilinkBlockConfig = createBlockConfig(() => ({
    type: "wikilink" as const,
    propSchema: {
        textAlignment: defaultProps.textAlignment,
        textColor: defaultProps.textColor,
        target: {
            default: "" as const,
        },
        displayText: {
            default: "" as const,
        },
        alias: {
            default: "" as const,
        },
        heading: {
            default: "" as const,
        },
        blockId: {
            default: "" as const,
        },
        isEmbed: {
            default: false as const,
        },
        resolved: {
            default: false as const,
        },
        targetNoteId: {
            default: "" as const,
        },
        targetFolderId: {
            default: "" as const,
        },
    },
    content: "none" as const,
}));

export const WikilinkBlock = createReactBlockSpec(
    CreateWikilinkBlockConfig,
    {
        render: (props) => {
            const navigate = useNavigate();
            const notes = useWorkspaceStore((s) => s.notes);
            const folders = useWorkspaceStore((s) => s.folders);
            const { resolveLink } = useLinkStore();
            
            const { 
                target, 
                displayText, 
                heading, 
                blockId, 
                isEmbed, 
                resolved,
                targetNoteId,
                targetFolderId
            } = props.block.props;
            
            const handleClick = () => {
                if (targetNoteId) {
                    navigate(`/dashboard/note/${targetNoteId}`);
                } else if (targetFolderId) {
                    // Navigate to folder view
                    navigate(`/dashboard/folder/${targetFolderId}`);
                } else {
                    // Try to resolve the link
                    const note = notes.find(n => 
                        n.title.toLowerCase() === target.toLowerCase()
                    );
                    if (note) {
                        // Update the link to be resolved
                        resolveLink(props.block.id, note.id, null);
                        navigate(`/dashboard/note/${note.id}`);
                        return;
                    }
                    
                    const folder = folders.find(f => 
                        f.name.toLowerCase() === target.toLowerCase()
                    );
                    if (folder) {
                        resolveLink(props.block.id, null, folder.id);
                        navigate(`/dashboard/folder/${folder.id}`);
                        return;
                    }
                    
                    // Couldn't resolve - offer to create
                    if (confirm(`Note "${target}" doesn't exist. Create it?`)) {
                        const { createNote } = useWorkspaceStore.getState();
                        const newNote = createNote(null, 'offline', 'note');
                        // Update note title
                        const { updateNote } = useWorkspaceStore.getState();
                        updateNote(newNote.id, { title: target });
                        resolveLink(props.block.id, newNote.id, null);
                        navigate(`/dashboard/note/${newNote.id}`);
                    }
                }
            };
            
            const fullDisplay = heading 
                ? `${displayText || target} › ${heading}`
                : displayText || target;
            
            if (isEmbed) {
                return (
                    <div className="my-4 rounded-lg border border-border bg-muted/50 p-4">
                        <div 
                            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer"
                            onClick={handleClick}
                        >
                            <Link2 className="h-4 w-4" />
                            <span>{fullDisplay}</span>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            Embedded content would appear here...
                        </div>
                    </div>
                );
            }
            
            return (
                <span 
                    className={`
                        inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer
                        transition-colors duration-150
                        ${resolved 
                            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                            : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
                        }
                    `}
                    onClick={handleClick}
                    title={resolved ? `Go to ${target}` : `Unresolved: ${target}`}
                >
                    {resolved ? (
                        <Link2 className="h-3 w-3" />
                    ) : (
                        <AlertCircle className="h-3 w-3" />
                    )}
                    <span>{fullDisplay}</span>
                </span>
            );
        },
    }
);
