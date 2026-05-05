"use client";

import { use, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Download,
  AlertCircle,
  Code,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { exportToObsidianMarkdown } from "@/lib/export";
import type { NoteDto, UpsertNoteDto, CodeLanguage } from "@cp-dashboard/types";

interface NotePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ handle?: string }>;
}

const LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
];

export default function NotePage({ params, searchParams }: NotePageProps) {
  const { id: problemId } = use(params);
  const { handle } = use(searchParams);
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<CodeLanguage>("cpp");
  const [saved, setSaved] = useState(false);

  const { data: note, isLoading } = useQuery<NoteDto | null>({
    queryKey: ["note", problemId],
    queryFn: () => api.getNote(problemId),
  });

  // Initialize editor state when note loads
  const [initialized, setInitialized] = useState(false);
  if (note && !initialized) {
    setContent(note.content);
    setCode(note.code ?? "");
    setLanguage((note.language as CodeLanguage) ?? "cpp");
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: (dto: UpsertNoteDto) => api.upsertNote(problemId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", problemId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ content, code: code || undefined, language });
  };

  const handleExport = useCallback(async () => {
    if (!note) return;
    const problem = await api.getProblem(problemId);
    exportToObsidianMarkdown({
      problem,
      note: { ...note, content, code, language },
      exportedAt: new Date().toISOString(),
    });
  }, [note, content, code, language, problemId]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Problem Notes
            </h1>
            <p className="text-xs text-muted-foreground">
              ID: {problemId}
              {handle && (
                <>
                  {" "}
                  •{" "}
                  <span className="text-primary">{handle}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!note}
            className="border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-400"
            id="export-markdown-button"
          >
            <Download className="mr-2 h-4 w-4" />
            Export .md
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            id="save-note-button"
          >
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Failed to save note. Please try again.
        </div>
      )}

      {/* Editor Tabs */}
      <Tabs defaultValue="notes" className="space-y-4" id="note-editor-tabs">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="notes">
            <FileText className="mr-2 h-3.5 w-3.5" />
            Notes / Editorial
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="mr-2 h-3.5 w-3.5" />
            Solution Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Markdown supported
              </span>
            </div>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes, observations, and editorial here...

## Approach
Describe your solution approach...

## Key Insights
- Insight 1
- Insight 2

## Complexity
- Time: O(n log n)
- Space: O(n)"
              className="min-h-[400px] resize-none rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </TabsContent>

        <TabsContent value="code">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-2.5 flex items-center gap-3">
              <Code className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Language:</span>
              <div className="flex gap-1">
                {LANGUAGES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLanguage(value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      language === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    id={`lang-${value}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="note-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// Your ${language === "cpp" ? "C++" : language === "python" ? "Python" : "TypeScript"} solution here...`}
              className="min-h-[400px] resize-none rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
