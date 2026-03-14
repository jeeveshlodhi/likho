import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import { Sparkles, Hash, Link2 } from 'lucide-react';
import { AskAIBlock } from '@/components/dashboard/editor/AskAIBlock';
import { WikilinkBlock } from '@/components/dashboard/editor/WikilinkBlock';
import { TagBlock } from '@/components/dashboard/editor/TagBlock';

/**
 * Safely parse note content for BlockNote (array of blocks).
 */
export function getInitialContent(content: any): any[] | undefined {
  if (!content) return undefined;

  if (Array.isArray(content)) {
    return content.length > 0 ? content : undefined;
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      return undefined;
    }
  }

  if (typeof content === 'object' && content !== null) {
    if (content.data && Array.isArray(content.data)) {
      return content.data;
    }
    if (content.content && Array.isArray(content.content)) {
      return content.content;
    }
    if (content.type === 'doc' && Array.isArray(content.content)) {
      return content.content;
    }
  }

  return undefined;
}

export const noteEditorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    askAi: AskAIBlock(),
    wikilink: WikilinkBlock(),
    tag: TagBlock(),
  },
});

type Editor = (typeof noteEditorSchema)['BlockNoteEditor'];

export function insertAIBlock(editor: Editor) {
  return {
    title: 'Ask AI',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{ type: 'askAi', props: { query: '', response: '', status: 'idle' } }],
        currentBlock,
        'after'
      );
    },
    aliases: ['ai', 'ask', '?'],
    group: 'AI',
    icon: <Sparkles size={18} />,
    subtext: 'Ask a question answered from your notes',
  };
}

export function insertWikilinkBlock(editor: Editor) {
  return {
    title: 'Insert Link',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'wikilink',
            props: {
              target: 'New Link',
              displayText: 'New Link',
              resolved: false,
            },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['link', 'wikilink', '[['],
    group: 'Links',
    icon: <Link2 size={18} />,
    subtext: 'Link to another note',
  };
}

export function insertTagBlock(editor: Editor) {
  return {
    title: 'Insert Tag',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'tag',
            props: {
              tagName: 'new-tag',
              color: '#f59e0b',
            },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['tag', '#'],
    group: 'Links',
    icon: <Hash size={18} />,
    subtext: 'Add a tag',
  };
}
