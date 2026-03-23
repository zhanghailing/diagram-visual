import { useState, useEffect } from 'react'
import { migrateProject } from '@/lib/project-io'
import { useStore } from '@/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'

interface Props {
  onClose: () => void
}

export function JsonImportDialog({ onClose }: Props) {
  const loadProject = useStore((s) => s.loadProject)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset state whenever the dialog mounts (i.e., is opened)
  useEffect(() => {
    setText('')
    setError(null)
  }, [])

  function handleImport() {
    setError(null)
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Please paste project JSON.')
      return
    }
    try {
      const raw = JSON.parse(trimmed)
      const project = migrateProject(raw)
      loadProject(project)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from JSON</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <p className="text-xs text-muted-foreground">
            Paste the contents of a <code className="bg-muted px-1 rounded">.migplan.json</code> file below.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='{ "version": 2, "name": "My Project", ... }'
            rows={10}
            className="font-mono text-xs"
          />
          {error && (
            <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 rounded p-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
