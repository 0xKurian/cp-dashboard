import { format } from "date-fns";
import type { MarkdownExportData } from "@cp-dashboard/types";

/**
 * Generates an Obsidian-compatible Markdown file and triggers download.
 *
 * Frontmatter format follows the Obsidian standard with YAML metadata
 * for seamless integration into local knowledge management vaults.
 */
export function exportToObsidianMarkdown(data: MarkdownExportData): void {
  const { problem, note, exportedAt } = data;
  const dateStr = format(new Date(exportedAt), "yyyy-MM-dd");

  const tagsYaml = `[${problem.tags.map((t) => `"${t}"`).join(", ")}]`;

  const codeFence =
    note.language === "cpp"
      ? "cpp"
      : note.language === "python"
        ? "python"
        : "typescript";

  const codeBlock = note.code?.trim()
    ? `## Solution (${note.language === "cpp" ? "C++" : note.language === "python" ? "Python" : "TypeScript"})

\`\`\`${codeFence}
${note.code.trim()}
\`\`\``
    : "";

  const markdown = `---
title: "${problem.name}"
tags: ${tagsYaml}
difficulty: ${problem.rating ?? "unknown"}
platform: codeforces
url: ${problem.url}
date: ${dateStr}
problem_id: "${problem.id}"
status: solved
---

# ${problem.name}

> **Platform:** [Codeforces](${problem.url})  
> **Difficulty:** ★ ${problem.rating ?? "N/A"}  
> **Tags:** ${problem.tags.join(", ")}

## Problem Statement

*[Add problem statement or link above]*

${codeBlock}

## Notes

${note.content?.trim() || "*No notes added yet.*"}

---
*Exported from CP Analytics Dashboard on ${dateStr}*
`;

  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const safeTitle = problem.name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${problem.id}_${safeTitle}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
