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
                <div className="flex w-full flex-col gap-2 rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/50 dark:bg-purple-900/10 mb-2 mt-2">
                    <div className="flex items-center gap-2 font-medium text-purple-700 dark:text-purple-400">
                        <Sparkles className="h-4 w-4" />
                        <span>AI Response</span>
                    </div>
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                        {props.block.props.response || "I am thinking..."}
                    </div>
                </div>
            );
        },
    }
);
