import type { ParsedLink } from '@/types/links';
import type { Note } from '@/types/workspace';

/**
 * Parse content for wikilinks and tags
 * Supports:
 * - [[Note Title]] - Link to note
 * - [[Note Title|Display Text]] - Link with alias
 * - [[Note Title#Heading]] - Link to heading within note
 * - [[Note Title#^block-id]] - Link to block within note
 * - ![[Note Title]] - Embed note content
 * - #tag - Tag
 * - #tag/subtag - Nested tag
 */

const WIKILINK_REGEX = /!?\[\[([^\]]+)\]\]/g;
const TAG_REGEX = /#([a-zA-Z0-9_/\-]+)/g;
const ALIAS_REGEX = /^([^|#\^]+)(?:\|([^#\^]+))?(?:#([^\^]+))?(?:\^(.+))?$/;

export function parseContentForLinks(note: Note): ParsedLink[] {
  const links: ParsedLink[] = [];

  if (!note.content) return links;

  // Parse content based on type
  const content = note.content;
  let textToParse = '';

  if (typeof content === 'string') {
    // Try to parse as JSON first (serialised BlockNote doc)
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        textToParse = extractTextFromBlockNote(parsed);
      } else {
        textToParse = content;
      }
    } catch {
      textToParse = content;
    }
  } else if (Array.isArray(content)) {
    // Direct BlockNote document — editor.document returns a flat array of blocks
    textToParse = extractTextFromBlockNote(content);
  } else if (typeof content === 'object' && content !== null) {
    if ((content as any).type === 'doc' && Array.isArray((content as any).content)) {
      // ProseMirror-style { type: 'doc', content: [...] }
      textToParse = extractTextFromBlockNote((content as any).content);
    } else if ((content as any).data && Array.isArray((content as any).data)) {
      // { data: [...] } wrapper
      textToParse = extractTextFromBlockNote((content as any).data);
    } else if ((content as any).data && Array.isArray((content as any).data.content)) {
      // { data: { content: [...] } } wrapper
      textToParse = extractTextFromBlockNote((content as any).data.content);
    } else {
      textToParse = JSON.stringify(content);
    }
  }
  
  // Reset lastIndex — global /g regexes keep state between calls; forgetting
  // this causes them to start mid-string and silently skip matches.
  WIKILINK_REGEX.lastIndex = 0;
  TAG_REGEX.lastIndex = 0;

  // Find wikilinks
  let match;
  while ((match = WIKILINK_REGEX.exec(textToParse)) !== null) {
    const raw = match[0];
    const linkContent = match[1].trim();
    const isEmbed = raw.startsWith('!');
    
    const parsed = parseLinkContent(linkContent);
    
    links.push({
      type: isEmbed ? 'embedded' : 'wikilink',
      raw,
      target: parsed.target,
      displayText: parsed.displayText || parsed.target,
      alias: parsed.alias,
      heading: parsed.heading,
      blockId: parsed.blockId,
      line: getLineNumber(textToParse, match.index),
      column: match.index,
    });
  }
  
  // Find tags (but not inside code blocks or URLs)
  const cleanText = removeCodeBlocks(textToParse);
  while ((match = TAG_REGEX.exec(cleanText)) !== null) {
    const raw = match[0];
    const tagName = match[1];
    
    // Skip if looks like a color code or part of URL
    if (isLikelyNotTag(raw, textToParse, match.index)) continue;
    
    links.push({
      type: 'tag',
      raw,
      target: tagName,
      displayText: tagName,
      line: getLineNumber(textToParse, match.index),
      column: match.index,
    });
  }
  
  return links;
}

interface ParsedLinkContent {
  target: string;
  displayText?: string;
  alias?: string;
  heading?: string;
  blockId?: string;
}

function parseLinkContent(content: string): ParsedLinkContent {
  const match = content.match(ALIAS_REGEX);
  if (!match) {
    return { target: content.trim() };
  }
  
  return {
    target: match[1].trim(),
    alias: match[2]?.trim(),
    displayText: match[2]?.trim() || match[1].trim(),
    heading: match[3]?.trim(),
    blockId: match[4]?.trim(),
  };
}

function extractTextFromBlockNote(blocks: any[]): string {
  let text = '';

  function extractFromBlock(block: any) {
    if (typeof block === 'string') {
      text += block + ' ';
      return;
    }

    if (!block || typeof block !== 'object') return;

    // Wikilink blocks store their target in props, not in content (content:"none")
    if (block.type === 'wikilink' && block.props?.target) {
      text += `[[${block.props.target}]] `;
      return;
    }

    // Tag blocks store their tag name in props
    if (block.type === 'tag' && block.props?.tagName) {
      text += `#${block.props.tagName} `;
      return;
    }

    // Inline content array — each item is { type: 'text', text: '...', styles: {} }
    if (Array.isArray(block.content)) {
      block.content.forEach((c: any) => {
        if (typeof c === 'string') {
          text += c + ' ';
        } else if (c && typeof c === 'object') {
          if (c.type === 'text' && typeof c.text === 'string') {
            text += c.text + ' ';
          } else if (typeof c.text === 'string') {
            text += c.text + ' ';
          }
        }
      });
    } else if (typeof block.content === 'string') {
      text += block.content + ' ';
    }

    // Recurse into nested blocks (indented items, etc.)
    if (Array.isArray(block.children)) {
      block.children.forEach(extractFromBlock);
    }
  }

  blocks.forEach(extractFromBlock);
  return text;
}

function removeCodeBlocks(text: string): string {
  // Simple removal of code blocks - in production, use proper parser
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

function isLikelyNotTag(raw: string, fullText: string, index: number): boolean {
  // Check if preceded by URL-like pattern
  const before = fullText.slice(Math.max(0, index - 10), index);
  if (before.match(/https?:\/\/[^\s]*$/)) return true;
  
  // Check if looks like a color code
  if (raw.match(/^#[0-9a-fA-F]{3,8}$/)) return true;
  
  return false;
}

function getLineNumber(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

/**
 * Convert a link target to a valid URL path
 */
export function targetToPath(target: string): string {
  return target.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Check if a string contains any link patterns
 */
export function containsLinks(text: string): boolean {
  return WIKILINK_REGEX.test(text) || TAG_REGEX.test(text);
}

/**
 * Replace link syntax in text with markdown links
 */
export function convertLinksToMarkdown(
  text: string,
  getNoteUrl: (target: string) => string | null,
  getTagUrl: (tag: string) => string
): string {
  let result = text;
  
  // Replace wikilinks
  result = result.replace(WIKILINK_REGEX, (match, content) => {
    const parsed = parseLinkContent(content);
    const url = getNoteUrl(parsed.target);
    
    if (url) {
      return `[${parsed.displayText}](${url})`;
    }
    
    // Unresolved link - show as text with styling
    return `<span class="unresolved-link">${parsed.displayText}</span>`;
  });
  
  // Replace tags
  result = result.replace(TAG_REGEX, (match, tag) => {
    const url = getTagUrl(tag);
    return `[#${tag}](${url})`;
  });
  
  return result;
}

/**
 * Extract all unique tags from content
 */
export function extractTags(content: any): string[] {
  const links = parseContentForLinks({ content } as Note);
  return links
    .filter(l => l.type === 'tag')
    .map(l => l.target)
    .filter((value, index, self) => self.indexOf(value) === index);
}

/**
 * Build a link from parts
 */
export function buildWikilink(
  target: string,
  options?: {
    alias?: string;
    heading?: string;
    blockId?: string;
    embed?: boolean;
  }
): string {
  let link = options?.embed ? '!' : '';
  link += '[[' + target;
  
  if (options?.alias) {
    link += '|' + options.alias;
  }
  
  if (options?.heading) {
    link += '#' + options.heading;
  }
  
  if (options?.blockId) {
    link += '#^' + options.blockId;
  }
  
  link += ']]';
  return link;
}
