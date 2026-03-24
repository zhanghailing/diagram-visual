import { useEffect, useRef, useState, useCallback } from 'react'
import mermaid from 'mermaid'
import { toPng } from 'html-to-image'
import { useStore } from '@/store'
import type { Diagram } from '@/types'
import { Button } from '@/components/ui/button'
import { Upload, Download, FileCode, Image, FileImage } from 'lucide-react'

interface Props {
  diagram: Diagram
}

const DEFAULT_CODE = 'flowchart LR\n  A --> B'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function MermaidDiagramView({ diagram }: Props) {
  const updateMermaidCode = useStore((s) => s.updateMermaidCode)

  const [code, setCode] = useState(diagram.mermaidCode ?? DEFAULT_CODE)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const debouncedCode = useDebouncedValue(code, 300)

  // Persist code changes to the store
  useEffect(() => {
    updateMermaidCode(diagram.id, code)
  }, [code, diagram.id, updateMermaidCode])

  // Render preview whenever debounced code changes
  useEffect(() => {
    if (!previewRef.current) return
    let cancelled = false

    const id = `mermaid-render-${diagram.id}`
    mermaid
      .render(id, debouncedCode)
      .then(({ svg }) => {
        if (cancelled || !previewRef.current) return
        previewRef.current.innerHTML = svg
        setRenderError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setRenderError(err instanceof Error ? err.message : String(err))
        if (previewRef.current) previewRef.current.innerHTML = ''
      })

    return () => {
      cancelled = true
    }
  }, [debouncedCode, diagram.id])

  // ── Export helpers ────────────────────────────────────────────────────────

  function exportMmd() {
    const blob = new Blob([code], { type: 'text/plain' })
    download(blob, `${diagram.name}.mmd`)
  }

  function exportSvg() {
    const svgEl = previewRef.current?.querySelector('svg')
    if (!svgEl) return
    const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' })
    download(blob, `${diagram.name}.svg`)
  }

  async function exportPng() {
    if (!previewRef.current) return
    try {
      const dataUrl = await toPng(previewRef.current)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${diagram.name}.png`
      a.click()
    } catch (e) {
      console.error('PNG export failed', e)
    }
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import helpers ────────────────────────────────────────────────────────

  async function validateAndSetCode(incoming: string) {
    try {
      const id = `mermaid-validate-${Date.now()}`
      await mermaid.render(id, incoming)
      setCode(incoming)
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleFileImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const text = await file.text()
      await validateAndSetCode(text.trim())
      e.target.value = ''
    },
    [],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-card shrink-0 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground mr-2">Mermaid</span>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" /> Import .mmd
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mmd,.txt"
          className="hidden"
          onChange={handleFileImport}
        />

        <div className="flex-1" />

        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={exportMmd}>
          <FileCode className="h-3.5 w-3.5" /> .mmd
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={exportSvg}>
          <Image className="h-3.5 w-3.5" /> SVG
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={exportPng}>
          <FileImage className="h-3.5 w-3.5" />
          <Download className="h-3 w-3 -ml-0.5" /> PNG
        </Button>
      </div>

      {importError && (
        <div className="px-3 py-1.5 text-xs text-destructive bg-destructive/10 border-b shrink-0">
          Import error: {importError}
        </div>
      )}

      {/* Split pane */}
      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className="flex flex-col w-1/2 min-w-0 border-r">
          <textarea
            className="flex-1 resize-none font-mono text-sm p-3 bg-background outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col flex-1 min-w-0 overflow-auto bg-white">
          {renderError ? (
            <div className="p-4 text-xs text-destructive font-mono whitespace-pre-wrap">
              {renderError}
            </div>
          ) : (
            <div
              ref={previewRef}
              className="flex-1 flex items-center justify-center p-4 [&>svg]:max-w-full [&>svg]:h-auto"
            />
          )}
        </div>
      </div>
    </div>
  )
}
