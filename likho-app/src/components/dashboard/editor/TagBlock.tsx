import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps, createBlockConfig } from "@blocknote/core";
import { Hash } from "lucide-react";
import { useNavigate } from "react-router";
import { useLinkStore } from "@/store/linkStore";

export const CreateTagBlockConfig = createBlockConfig(() => ({
    type: "tag" as const,
    propSchema: {
        textAlignment: defaultProps.textAlignment,
        textColor: defaultProps.textColor,
        tagName: {
            default: "" as const,
        },
        tagId: {
            default: "" as const,
        },
        color: {
            default: "#f59e0b" as const,
        },
    },
    content: "none" as const,
}));

export const TagBlock = createReactBlockSpec(
    CreateTagBlockConfig,
    {
        render: (props) => {
            const navigate = useNavigate();
            const { tagName, color } = props.block.props;
            
            const handleClick = () => {
                // Navigate to tag view
                navigate(`/dashboard/tag/${encodeURIComponent(tagName)}`);
            };
            
            // Parse nested tag path
            const parts = tagName.split('/');
            const displayName = parts[parts.length - 1];
            const parentPath = parts.length > 1 ? parts.slice(0, -1).join(' / ') : null;
            
            return (
                <span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer
                             transition-all duration-150 hover:scale-105"
                    style={{
                        backgroundColor: `${color}20`,
                        color: color,
                        border: `1px solid ${color}40`,
                    }}
                    onClick={handleClick}
                    title={`Filter by #${tagName}`}
                >
                    <Hash className="h-3 w-3" />
                    <span className="text-sm font-medium">
                        {parentPath ? (
                            <>
                                <span className="opacity-60">{parentPath} / </span>
                                <span>{displayName}</span>
                            </>
                        ) : displayName}
                    </span>
                </span>
            );
        },
    }
);

/**
 * Inline tag component for use within text
 */
export function InlineTag({ 
    name, 
    color = "#f59e0b",
    onClick 
}: { 
    name: string; 
    color?: string;
    onClick?: () => void;
}) {
    const parts = name.split('/');
    const displayName = parts[parts.length - 1];
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join(' / ') : null;
    
    return (
        <span 
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer
                     transition-all duration-150 hover:opacity-80"
            style={{
                backgroundColor: `${color}15`,
                color: color,
            }}
            onClick={onClick}
        >
            <Hash className="h-3 w-3" />
            <span className="text-sm">
                {parentPath ? (
                    <>
                        <span className="opacity-50">{parentPath}/</span>
                        {displayName}
                    </>
                ) : displayName}
            </span>
        </span>
    );
}
