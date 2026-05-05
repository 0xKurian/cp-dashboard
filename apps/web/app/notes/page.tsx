"use client";

import { FileText } from "lucide-react";

export default function NotesIndexPage() {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full gap-4 text-center">
      <FileText className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-bold text-foreground">My Notes</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Navigate to a problem page to view or write notes. Notes are
        auto-saved and can be exported as Obsidian-compatible Markdown.
      </p>
    </div>
  );
}
