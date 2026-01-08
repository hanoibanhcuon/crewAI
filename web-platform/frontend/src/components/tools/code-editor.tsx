"use client";

import { useRef, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  theme?: "vs-dark" | "light";
}

// Default Python tool template
export const DEFAULT_TOOL_TEMPLATE = `from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Type, Any

class MyToolInput(BaseModel):
    """Input schema for MyTool."""
    query: str = Field(..., description="The search query")

class MyTool(BaseTool):
    """
    A custom tool that does something useful.

    Attributes:
        name: The name of the tool
        description: A description of what the tool does
        args_schema: The input schema for the tool
    """
    name: str = "my_tool"
    description: str = "A custom tool that performs a specific task"
    args_schema: Type[BaseModel] = MyToolInput

    def _run(self, query: str) -> str:
        """
        Execute the tool with the given query.

        Args:
            query: The search query to process

        Returns:
            The result of the tool execution
        """
        # Add your custom logic here
        result = f"Processed: {query}"
        return result
`;

export function CodeEditor({
  value,
  onChange,
  language = "python",
  height = "400px",
  readOnly = false,
  theme = "vs-dark",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [Monaco, setMonaco] = useState<any>(null);

  useEffect(() => {
    // Dynamically import Monaco editor
    let mounted = true;

    const loadMonaco = async () => {
      try {
        // Use dynamic import for Monaco
        const monaco = await import("monaco-editor");

        if (!mounted) return;

        setMonaco(monaco);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load Monaco editor:", error);
        setIsLoading(false);
      }
    };

    loadMonaco();

    return () => {
      mounted = false;
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!Monaco || !containerRef.current || editorRef.current) return;

    // Create editor instance
    editorRef.current = Monaco.editor.create(containerRef.current, {
      value,
      language,
      theme,
      readOnly,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      folding: true,
      glyphMargin: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3,
      renderLineHighlight: "line",
      scrollbar: {
        vertical: "auto",
        horizontal: "auto",
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });

    // Listen for changes
    editorRef.current.onDidChangeModelContent(() => {
      const newValue = editorRef.current.getValue();
      onChange(newValue);
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Monaco, language, readOnly, theme]);

  // Update value when it changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (value !== currentValue) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  // Fallback to textarea if Monaco fails to load
  if (!isLoading && !Monaco) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full font-mono text-sm p-4 bg-zinc-900 text-zinc-100 rounded-lg border border-zinc-700 focus:outline-none focus:border-primary"
        style={{ height, resize: "vertical" }}
        readOnly={readOnly}
        spellCheck={false}
      />
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-border">
      {isLoading && (
        <div
          className="flex items-center justify-center bg-zinc-900"
          style={{ height }}
        >
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}
      <div
        ref={containerRef}
        style={{ height, display: isLoading ? "none" : "block" }}
      />
    </div>
  );
}

// Simple code editor using textarea (for cases where Monaco is not needed)
export function SimpleCodeEditor({
  value,
  onChange,
  height = "400px",
  readOnly = false,
  placeholder = "",
}: {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-border">
      <div className="absolute top-0 left-0 w-10 h-full bg-zinc-800 border-r border-zinc-700 flex flex-col items-end py-3 px-2 text-xs text-zinc-500 font-mono select-none">
        {value.split("\n").map((_, i) => (
          <div key={i} className="leading-6">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 py-3 pr-4 font-mono text-sm bg-zinc-900 text-zinc-100 focus:outline-none"
        style={{ height, resize: "vertical", lineHeight: "1.5rem" }}
        readOnly={readOnly}
        spellCheck={false}
        placeholder={placeholder}
      />
    </div>
  );
}
