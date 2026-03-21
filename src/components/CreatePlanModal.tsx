import { useState } from 'react'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const addPlan = useStore((s) => s.addPlan)
  const setActivePlan = useStore((s) => s.setActivePlan)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return setError('Plan name is required.')
    const result = addPlan(trimmed, description.trim() || undefined)
    if (!result.ok) return setError(result.reason ?? 'Cannot create plan')
    if (result.plan) setActivePlan(result.plan.id)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Migration Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="e.g. Correct Order"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-desc">Description (optional)</Label>
            <Textarea
              id="plan-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the approach..."
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
