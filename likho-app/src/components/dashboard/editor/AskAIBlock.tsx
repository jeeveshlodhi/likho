import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps, createBlockConfig } from "@blocknote/core";
import { Sparkles } from "lucide-react";

export const CreateAskAIBlockConfig = createBlockConfig(() => ({
    type: "askAi" as const,
    propSchema: {
        textAlignment: defaultProps.textAlignment,
        textColor: defaultProps.textColor,
        response: {
            default: "" as const,
        },
    },
    content: "none" as const,
}));

export const AskAIBlock = createReactBlockSpec(
    CreateAskAIBlockConfig,
    {
        render: (props) => {
            return (
                <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-muted p-4 mb-2 mt-2">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span>AI Response</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {props.block.props.response || "I am thinking..."}
                    </div>
                </div>
            );
        },
    }
);
