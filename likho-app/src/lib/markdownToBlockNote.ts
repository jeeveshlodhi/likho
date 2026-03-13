/**
 * Convert a Markdown string into an array of BlockNote blocks.
 *
 * Supported conversions:
 *   # / ## / ###     → heading (level 1-3)
 *   paragraph text   → paragraph
 *   - item           → bulletListItem
 *   1. item          → numberedListItem
 *   - [x] / - [ ]   → checkListItem
 *   ```code```       → codeBlock
 *   > quote          → paragraph (BlockNote has no native quote block)
 *   | table |        → table (BlockNote table content)
 *   **bold**         → bold inline style
 *   _italic_         → italic inline style
 *   `inline code`    → code inline style
 *   ~~strike~~       → strikethrough inline style
 *   [link](url)      → link inline content
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type {
  Root, Content, Paragraph, Heading, List, ListItem, Code, Blockquote,
  Table, TableRow, TableCell, PhrasingContent, Text, Strong, Emphasis,
  InlineCode, Delete, Link, Image,
} from 'mdast';

// ── Inline content ────────────────────────────────────────────────────────────

type Styles = {
  bold?: true;
  italic?: true;
  underline?: true;
  strikethrough?: true;
  code?: true;
};

type BnText = { type: 'text'; text: string; styles: Styles };
type BnLink = { type: 'link'; href: string; content: BnText[] };
type BnInline = BnText | BnLink;

function mergeStyles(base: Styles, extra: Styles): Styles {
  return { ...base, ...extra };
}

function phrasingToInline(nodes: PhrasingContent[], parentStyles: Styles = {}): BnInline[] {
  const result: BnInline[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case 'text': {
        if ((node as Text).value) {
          result.push({ type: 'text', text: (node as Text).value, styles: { ...parentStyles } });
        }
        break;
      }
      case 'strong': {
        result.push(...phrasingToInline((node as Strong).children, mergeStyles(parentStyles, { bold: true })));
        break;
      }
      case 'emphasis': {
        result.push(...phrasingToInline((node as Emphasis).children, mergeStyles(parentStyles, { italic: true })));
        break;
      }
      case 'inlineCode': {
        result.push({ type: 'text', text: (node as InlineCode).value, styles: mergeStyles(parentStyles, { code: true }) });
        break;
      }
      case 'delete': {
        result.push(...phrasingToInline((node as Delete).children, mergeStyles(parentStyles, { strikethrough: true })));
        break;
      }
      case 'link': {
        const linkNode = node as Link;
        const linkContent = phrasingToInline(linkNode.children, {})
          .filter((n): n is BnText => n.type === 'text');
        result.push({ type: 'link', href: linkNode.url, content: linkContent });
        break;
      }
      case 'image': {
        const imgNode = node as Image;
        result.push({ type: 'text', text: imgNode.alt || imgNode.url, styles: parentStyles });
        break;
      }
      case 'break': {
        result.push({ type: 'text', text: '\n', styles: parentStyles });
        break;
      }
      default: {
        // For any unhandled phrasing node that has children, recurse
        const anyNode = node as any;
        if (anyNode.children) {
          result.push(...phrasingToInline(anyNode.children, parentStyles));
        } else if (anyNode.value) {
          result.push({ type: 'text', text: anyNode.value, styles: parentStyles });
        }
      }
    }
  }

  return result;
}

// ── Block conversion ──────────────────────────────────────────────────────────

function paragraphToBlock(node: Paragraph): any {
  return {
    type: 'paragraph',
    content: phrasingToInline(node.children),
  };
}

function headingToBlock(node: Heading): any {
  const level = Math.min(node.depth, 3) as 1 | 2 | 3;
  return {
    type: 'heading',
    props: { level },
    content: phrasingToInline(node.children),
  };
}

function codeToBlock(node: Code): any {
  return {
    type: 'codeBlock',
    props: { language: node.lang ?? '' },
    content: [{ type: 'text', text: node.value, styles: {} }],
  };
}

function blockquoteToBlocks(node: Blockquote): any[] {
  // BlockNote has no native quote type; render as paragraphs
  return node.children.flatMap((child) => contentNodeToBlocks(child));
}

function listItemToBlock(item: ListItem, ordered: boolean): any {
  const firstChild = item.children[0];

  // Check for task list item (GFM)
  if (
    firstChild?.type === 'paragraph' &&
    firstChild.children?.[0]?.type === 'text'
  ) {
    const text = (firstChild.children[0] as Text).value;
    if (text.startsWith('[ ] ') || text.startsWith('[x] ') || text.startsWith('[X] ')) {
      const checked = text[1].toLowerCase() === 'x';
      const rest = firstChild.children.slice(1);
      const firstText: PhrasingContent = {
        type: 'text',
        value: text.slice(4),
      } as Text;
      return {
        type: 'checkListItem',
        props: { checked },
        content: phrasingToInline([firstText, ...rest]),
      };
    }
  }

  const content = firstChild?.type === 'paragraph'
    ? phrasingToInline((firstChild as Paragraph).children)
    : [];

  return {
    type: ordered ? 'numberedListItem' : 'bulletListItem',
    content,
  };
}

function listToBlocks(node: List): any[] {
  return node.children.map((item) => listItemToBlock(item, node.ordered ?? false));
}

function tableToBlock(node: Table): any {
  const rows = node.children.map((row: TableRow, rowIdx: number) => ({
    cells: row.children.map((cell: TableCell) => ({
      type: 'tableCell',
      content: phrasingToInline(cell.children),
    })),
  }));

  return {
    type: 'table',
    content: {
      type: 'tableContent',
      rows,
    },
  };
}

function contentNodeToBlocks(node: Content): any[] {
  switch (node.type) {
    case 'paragraph':
      return [paragraphToBlock(node as Paragraph)];
    case 'heading':
      return [headingToBlock(node as Heading)];
    case 'code':
      return [codeToBlock(node as Code)];
    case 'blockquote':
      return blockquoteToBlocks(node as Blockquote);
    case 'list':
      return listToBlocks(node as List);
    case 'table':
      return [tableToBlock(node as Table)];
    case 'thematicBreak':
      return [{ type: 'paragraph', content: [] }];
    default:
      return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function markdownToBlockNoteBlocks(markdown: string): any[] {
  if (!markdown.trim()) return [{ type: 'paragraph', content: [] }];

  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown) as Root;
  const blocks = tree.children.flatMap((node) => contentNodeToBlocks(node as Content));
  return blocks.length > 0 ? blocks : [{ type: 'paragraph', content: [] }];
}
