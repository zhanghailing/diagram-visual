import type { Project } from '@/types'

const CURRENT_VERSION = 1 as const

export function createEmptyProject(name = 'Untitled Project'): Project {
  return {
    version: CURRENT_VERSION,
    name,
    components: [],
    dependencies: [],
    plans: [],
    releases: [],
  }
}

export function exportProject(project: Project): void {
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = project.name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
  a.download = `${safeName}.migplan.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importProject(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)
        const project = migrateProject(raw)
        resolve(project)
      } catch (err) {
        reject(new Error(`Invalid project file: ${(err as Error).message}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/** Forward-migrate older project versions to current schema */
function migrateProject(raw: unknown): Project {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Not a valid project object')
  }
  const obj = raw as Record<string, unknown>
  // v1 → current (no migration needed yet)
  if (obj.version !== CURRENT_VERSION) {
    throw new Error(`Unsupported project version: ${obj.version}`)
  }
  return obj as unknown as Project
}

const LS_KEY = 'migplan_autosave'

export function saveToLocalStorage(project: Project): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(project))
  } catch {
    // quota exceeded — silently ignore
  }
}

export function loadFromLocalStorage(): Project | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return migrateProject(JSON.parse(raw))
  } catch {
    return null
  }
}
