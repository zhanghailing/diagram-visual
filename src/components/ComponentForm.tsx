import { useState } from 'react'
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '@/store'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Component, ComponentType, ComponentState } from '@/types'

const COMPONENT_TYPES: ComponentType[] = [
  'frontend',
  'backend',
  'library',
  'gateway',
  'platform',
  'other',
]

interface Props {
  initialValues?: Component
  onClose: () => void
}

export function ComponentForm({ initialValues, onClose }: Props) {
  const addComponent = useStore((s) => s.addComponent)
  const updateComponent = useStore((s) => s.updateComponent)
  const existingComponents = useStore((s) => s.project.components)

  const [name, setName] = useState(initialValues?.name ?? '')
  const [type, setType] = useState<ComponentType>(initialValues?.type ?? 'backend')
  const [states, setStates] = useState<ComponentState[]>(
    initialValues?.states ?? [
      { id: generateId(), name: '' },
      { id: generateId(), name: '' },
    ],
  )
  const [error, setError] = useState<string | null>(null)

  function addState() {
    setStates((prev) => [...prev, { id: generateId(), name: '' }])
  }

  function removeState(id: string) {
    setStates((prev) => prev.filter((s) => s.id !== id))
  }

  function moveState(index: number, dir: -1 | 1) {
    setStates((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function updateStateName(id: string, value: string) {
    setStates((prev) => prev.map((s) => (s.id === id ? { ...s, name: value } : s)))
  }

  function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) return setError('Name is required.')

    const validStates = states.filter((s) => s.name.trim())
    if (validStates.length < 2) return setError('At least 2 states are required.')

    const isDuplicate = existingComponents.some(
      (c) => c.name === trimmedName && c.id !== initialValues?.id,
    )
    if (isDuplicate) return setError(`A component named "${trimmedName}" already exists.`)

    if (initialValues) {
      updateComponent(initialValues.id, { name: trimmedName, type, states: validStates })
    } else {
      addComponent({ name: trimmedName, type, states: validStates })
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Component' : 'Add Component'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="comp-name">Name</Label>
            <Input
              id="comp-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="e.g. Backend Service"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comp-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ComponentType)}>
              <SelectTrigger id="comp-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>States (ordered, first = initial)</Label>
            <div className="space-y-1.5">
              {states.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveState(i, -1)}
                      disabled={i === 0}
                      className="h-4 w-4 disabled:opacity-30"
                      aria-label="Move state up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveState(i, 1)}
                      disabled={i === states.length - 1}
                      className="h-4 w-4 disabled:opacity-30"
                      aria-label="Move state down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <Input
                    value={s.name}
                    onChange={(e) => updateStateName(s.id, e.target.value)}
                    placeholder={i === 0 ? 'Initial state (e.g. v1)' : `State ${i + 1}`}
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeState(s.id)}
                    disabled={states.length <= 2}
                    aria-label="Remove state"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full mt-1"
              onClick={addState}
            >
              <Plus className="h-3 w-3 mr-1" /> Add State
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initialValues ? 'Save' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
