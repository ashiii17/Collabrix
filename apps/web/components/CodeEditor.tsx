"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef } from "react";

const LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
};

type Props = {
  value: string;
  language: string;
  onChange: (value: string) => void;
  minimap?: boolean;
};

export function CodeEditor({ value, language, onChange, minimap = false }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={LANGUAGE_MAP[language] ?? "javascript"}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      options={{
        fontSize: 14,
        lineNumbers: "on",
        minimap: { enabled: minimap },
        autoIndent: "full",
        tabSize: 2,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}
