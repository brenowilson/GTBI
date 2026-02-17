import { useMemo } from "react";

interface ArticleViewProps {
  content: string;
}

/**
 * Lightweight markdown renderer that converts markdown to HTML.
 * Supports headers, bold, italic, lists, code blocks, inline code,
 * links, horizontal rules, and tables.
 */
function parseMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let inOrderedList = false;
  let inTable = false;
  let tableHeaderDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Code blocks (```)
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        htmlLines.push("</code></pre>");
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        htmlLines.push('<pre class="rounded-lg bg-muted p-4 overflow-x-auto text-sm"><code>');
      }
      continue;
    }

    if (inCodeBlock) {
      htmlLines.push(escapeHtml(line));
      continue;
    }

    // Close lists if needed
    if (inList && !line.trim().startsWith("- ") && !line.trim().startsWith("* ") && line.trim() !== "") {
      htmlLines.push("</ul>");
      inList = false;
    }

    if (inOrderedList && !/^\d+\.\s/.test(line.trim()) && line.trim() !== "") {
      htmlLines.push("</ol>");
      inOrderedList = false;
    }

    // Close table if needed
    if (inTable && !line.trim().startsWith("|")) {
      htmlLines.push("</tbody></table></div>");
      inTable = false;
      tableHeaderDone = false;
    }

    // Empty line
    if (line.trim() === "") {
      if (!inList && !inOrderedList && !inTable) {
        htmlLines.push("");
      }
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      htmlLines.push(`<h3 class="text-lg font-semibold mt-6 mb-2">${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      htmlLines.push(`<h2 class="text-xl font-semibold mt-8 mb-3 border-b border-border pb-2">${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      htmlLines.push(`<h1 class="text-2xl font-bold mt-4 mb-4">${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      htmlLines.push('<hr class="my-6 border-border" />');
      continue;
    }

    // Table
    if (line.trim().startsWith("|")) {
      // Skip separator row
      if (/^\|[\s-:|]+\|$/.test(line.trim())) {
        tableHeaderDone = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        htmlLines.push('<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-sm">');
        // This is the header row
        const cells = parseTableRow(line);
        htmlLines.push("<thead><tr>");
        for (const cell of cells) {
          htmlLines.push(`<th class="border border-border bg-muted px-4 py-2 text-left font-semibold">${formatInline(cell)}</th>`);
        }
        htmlLines.push("</tr></thead><tbody>");
        continue;
      }

      if (tableHeaderDone || inTable) {
        const cells = parseTableRow(line);
        htmlLines.push("<tr>");
        for (const cell of cells) {
          htmlLines.push(`<td class="border border-border px-4 py-2">${formatInline(cell)}</td>`);
        }
        htmlLines.push("</tr>");
        continue;
      }
    }

    // Unordered list
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc pl-6 my-2 space-y-1">');
        inList = true;
      }
      const content = line.trim().slice(2);
      htmlLines.push(`<li class="text-foreground">${formatInline(content)}</li>`);
      continue;
    }

    // Ordered list
    const orderedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
    if (orderedMatch) {
      if (!inOrderedList) {
        htmlLines.push('<ol class="list-decimal pl-6 my-2 space-y-1">');
        inOrderedList = true;
      }
      const matchedContent = orderedMatch[2] ?? "";
      htmlLines.push(`<li class="text-foreground">${formatInline(matchedContent)}</li>`);
      continue;
    }

    // Paragraph
    htmlLines.push(`<p class="my-2 leading-7 text-foreground">${formatInline(line)}</p>`);
  }

  // Close any open elements
  if (inList) htmlLines.push("</ul>");
  if (inOrderedList) htmlLines.push("</ol>");
  if (inCodeBlock) htmlLines.push("</code></pre>");
  if (inTable) htmlLines.push("</tbody></table></div>");

  return htmlLines.join("\n");
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInline(text: string): string {
  let result = escapeHtml(text);

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");

  // Inline code: `text`
  result = result.replace(
    /`(.+?)`/g,
    '<code class="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">$1</code>'
  );

  // Links: [text](url)
  result = result.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return result;
}

export function ArticleView({ content }: ArticleViewProps) {
  const html = useMemo(() => parseMarkdown(content.trim()), [content]);

  return (
    <div
      className="article-content max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
