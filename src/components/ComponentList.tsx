import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ComponentForm } from './ComponentForm'
import type { Component } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  frontend: 'bg-blue-100 text-blue-800',
  backend: 'bg-green-100 text-green-800',
  library: 'bg-purple-100 text-purple-800',
  gateway: 'bg-orange-100 text-orange-800',
  platform: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800',
}

export function ComponentList() {
  const components = useStore((s) => s.project.components)
  const deleteComponent = useStore((s) => s.deleteComponent)
  const selectedComponentId = useStore((s) => s.selectedComponentId)
  const setSelectedComponent = useStore((s) => s.setSelectedComponent)

  const [editingComponent, setEditingComponent] = useState<Component | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete(id: string) {
    const result = deleteComponent(id)
    if (!result.ok) setDeleteError(result.reason ?? 'Cannot delete')
    else setDeleteError(null)
  }

  if (components.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p className="mb-2">No components yet.</p>
          <p>Add components to start modelling your migration.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add Component
        </Button>
        {showCreate && <ComponentForm onClose={() => setShowCreate(false)} />}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Components ({components.length})
        </span>
        <Button size="sm" variant="ghost" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {components.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedComponent(c.id === selectedComponentId ? null : c.id)}
              className={cn(
                'group flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors',
                c.id === selectedComponentId && 'bg-accent',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                </div>
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-medium',
                    TYPE_COLORS[c.type] ?? TYPE_COLORS.other,
                  )}
                >
                  {c.type}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.states.map((s) => (
                    <Badge key={s.id} variant="outline" className="text-xs py-0 h-5">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); setEditingComponent(c) }}
                  aria-label={`Edit ${c.name}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{c.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove the component. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                      <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteError(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add Component
        </Button>
      </div>

      {showCreate && <ComponentForm onClose={() => setShowCreate(false)} />}
      {editingComponent && (
        <ComponentForm
          initialValues={editingComponent}
          onClose={() => setEditingComponent(null)}
        />
      )}
    </div>
  )
}
