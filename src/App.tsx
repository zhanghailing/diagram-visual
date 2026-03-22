import { useRef } from 'react'
import { useStore } from '@/store'
import { exportProject, importProject } from '@/lib/project-io'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ComponentList } from '@/components/ComponentList'
import { PlanList } from '@/components/PlanList'
import { DependencyGraphView } from '@/views/DependencyGraphView'
import { PlanTimelineView } from '@/views/PlanTimelineView'
import { PlanComparisonView } from '@/views/PlanComparisonView'
import { ReleaseTrackerView } from '@/views/ReleaseTrackerView'
import { DiagramListView } from '@/views/DiagramListView'
import {
  Network,
  GitCompare,
  Rocket,
  Download,
  Upload,
  FilePlus2,
  Save,
  LayoutTemplate,
} from 'lucide-react'
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
import type { ActiveView } from '@/types'

// Custom Timeline icon — Lucide doesn't have one
function TimelineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="6" r="2" fill="currentColor" />
      <circle cx="14" cy="12" r="2" fill="currentColor" />
      <circle cx="10" cy="18" r="2" fill="currentColor" />
    </svg>
  )
}

export default function App() {
  const project = useStore((s) => s.project)
  const activeView = useStore((s) => s.activeView)
  const setActiveView = useStore((s) => s.setActiveView)
  const hasUnsavedChanges = useStore((s) => s.hasUnsavedChanges)
  const loadProject = useStore((s) => s.loadProject)
  const newProject = useStore((s) => s.newProject)
  const markExported = useStore((s) => s.markExported)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    exportProject(project)
    markExported()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importProject(file)
      loadProject(imported)
    } catch (err) {
      alert((err as Error).message)
    }
    e.target.value = ''
  }

  const navItems: { id: ActiveView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dependency-graph', label: 'Dependency Graph', icon: Network },
    { id: 'plan-timeline', label: 'Plan Timeline', icon: TimelineIcon },
    { id: 'plan-comparison', label: 'Compare Plans', icon: GitCompare },
    { id: 'release-tracker', label: 'Release Tracker', icon: Rocket },
    { id: 'diagrams', label: 'Diagrams', icon: LayoutTemplate },
  ]

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="w-64 flex flex-col border-r bg-card shrink-0">
          {/* Project header */}
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm truncate">{project.name}</span>
              {hasUnsavedChanges && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Save className="h-3 w-3" /> unsaved
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 flex-1 text-xs" onClick={handleExport}>
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 flex-1 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-1" /> Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.migplan.json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-full text-xs mt-1">
                  <FilePlus2 className="h-3 w-3 mr-1" /> New Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Create New Project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All unsaved changes will be lost. Export first if you want to keep them.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => newProject()}>Create New</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Nav */}
          <nav className="p-2 space-y-0.5 border-b">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
                  activeView === item.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Component list */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <ComponentList />
            </div>
            <Separator />
            <div className="flex-1 min-h-0">
              <PlanList />
            </div>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {activeView === 'dependency-graph' && <DependencyGraphView />}
          {activeView === 'plan-timeline' && <PlanTimelineView />}
          {activeView === 'plan-comparison' && <PlanComparisonView />}
          {activeView === 'release-tracker' && <ReleaseTrackerView />}
          {activeView === 'diagrams' && <DiagramListView />}
        </main>
      </div>
    </TooltipProvider>
  )
}
