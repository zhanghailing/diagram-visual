import { useState } from 'react'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AddEdgePanel({ onClose }: { onClose: () => void }) {
  const components = useStore((s) => s.project.components)
  const addDependencyEdge = useStore((s) => s.addDependencyEdge)

  const [fromComp, setFromComp] = useState('')
  const [fromState, setFromState] = useState('')
  const [toComp, setToComp] = useState('')
  const [toState, setToState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fromComponent = components.find((c) => c.id === fromComp)
  const toComponent = components.find((c) => c.id === toComp)

  function handleAdd() {
    if (!fromComp || !fromState || !toComp || !toState) {
      return setError('All fields are required.')
    }
    const result = addDependencyEdge({ from: fromComp, fromState, to: toComp, toState })
    if (!result.ok) return setError(result.reason ?? 'Cannot add edge')
    onClose()
  }

  return (
    <div className="p-4 border rounded-lg bg-card space-y-3 shadow-md">
      <p className="text-sm font-medium">Add Dependency Edge</p>
      <p className="text-xs text-muted-foreground">
        "Component <strong>To</strong> can only enter <strong>To State</strong> if component{' '}
        <strong>From</strong> is already in <strong>From State</strong>."
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">From Component</Label>
          <Select value={fromComp} onValueChange={(v) => { setFromComp(v); setFromState(''); setError(null) }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {components.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">From State</Label>
          <Select
            value={fromState}
            onValueChange={(v) => { setFromState(v); setError(null) }}
            disabled={!fromComponent}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {fromComponent?.states.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">To Component</Label>
          <Select value={toComp} onValueChange={(v) => { setToComp(v); setToState(''); setError(null) }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {components.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">To State</Label>
          <Select
            value={toState}
            onValueChange={(v) => { setToState(v); setError(null) }}
            disabled={!toComponent}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {toComponent?.states.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleAdd}>Add Edge</Button>
      </div>
    </div>
  )
}
