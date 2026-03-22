import type { Project } from '@/types'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'

const CURRENT_VERSION = 2 as const

export function createEmptyProject(name = 'Untitled Project'): Project {
  return {
    version: CURRENT_VERSION,
    name,
    components: [],
    dependencies: [],
    plans: [],
    releases: [],
    diagrams: [],
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

  // v1 → v2: add type discriminant to plan steps (default missing type to "state-transition")
  if (obj.version === 1) {
    const plans = (obj.plans as Array<Record<string, unknown>>) ?? []
    for (const plan of plans) {
      const steps = (plan.steps as Array<Record<string, unknown>>) ?? []
      for (const step of steps) {
        if (!step.type) {
          step.type = 'state-transition'
        }
      }
    }
    obj.version = 2
  }

  if (obj.version !== CURRENT_VERSION) {
    throw new Error(`Unsupported project version: ${obj.version}`)
  }
  // Ensure diagrams array always exists (added in diagram-authoring-tool change)
  if (!Array.isArray(obj.diagrams)) {
    obj.diagrams = []
  }
  return obj as unknown as Project
}

// ─── Diagram export ────────────────────────────────────────────────────────────

/** Converts a diagram/project name to a safe kebab-case filename fragment. */
export function toSafeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
}

/**
 * html-to-image uses cloneNode(true) for SVG elements, which copies attributes but
 * not computed CSS styles. ReactFlow edge paths get their stroke/fill from a stylesheet,
 * not inline styles, so they render invisibly in the captured image. Before capturing,
 * inline computed stroke/fill/opacity on all SVG drawing elements, then restore after.
 */
function inlineSvgStyles(container: HTMLElement): () => void {
  const SVG_STYLE_PROPS = ['stroke', 'stroke-width', 'stroke-opacity', 'fill', 'fill-opacity', 'stroke-dasharray', 'opacity']
  const restores: Array<() => void> = []

  container.querySelectorAll<SVGElement>('.react-flow__edges *').forEach((el) => {
    const computed = getComputedStyle(el)
    const prev: Record<string, string> = {}
    for (const prop of SVG_STYLE_PROPS) {
      const val = computed.getPropertyValue(prop)
      if (val && val !== 'none' && !el.style.getPropertyValue(prop)) {
        prev[prop] = el.style.getPropertyValue(prop)
        el.style.setProperty(prop, val)
      }
    }
    if (Object.keys(prev).length > 0) {
      restores.push(() => {
        for (const [prop, val] of Object.entries(prev)) {
          el.style.setProperty(prop, val)
        }
      })
    }
  })

  // Edge label background rects rely on CSS for their fill; without it they default
  // to SVG's implicit black fill in the cloned DOM used by html-to-image.
  container.querySelectorAll<SVGElement>('.react-flow__edge-textbg').forEach((el) => {
    const prev = el.style.getPropertyValue('fill')
    el.style.setProperty('fill', 'white')
    restores.push(() => {
      if (prev) {
        el.style.setProperty('fill', prev)
      } else {
        el.style.removeProperty('fill')
      }
    })
  })

  return () => restores.forEach((fn) => fn())
}

const RF_UI_SELECTORS = ['.react-flow__controls', '.react-flow__minimap', '.react-flow__background']

async function captureReactFlowPng(container: HTMLElement): Promise<string> {
  // Target .react-flow__renderer which contains both the viewport (nodes) and
  // the edges SVG (including <defs> arrowhead markers). Falling back to the
  // .react-flow root, then the container if not found.
  const rfRoot = container.querySelector<HTMLElement>('.react-flow') ?? container
  const { width, height } = rfRoot.getBoundingClientRect()
  const target = rfRoot.querySelector<HTMLElement>('.react-flow__renderer') ?? rfRoot

  const restore = inlineSvgStyles(rfRoot)
  try {
    const options = {
      backgroundColor: '#ffffff',
      width,
      height,
      filter: (node: HTMLElement) => !RF_UI_SELECTORS.some((sel) => node.matches?.(sel)),
    }
    await toPng(target, options) // first call: warms up font/image resource loading
    return toPng(target, options) // second call: produces complete output
  } finally {
    restore()
  }
}

/**
 * Captures a DOM element as PNG and triggers a browser download.
 * Filename should include the `.png` extension.
 */
export async function exportCanvasToPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureReactFlowPng(element)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

/**
 * Captures a DOM element as a PNG Blob (used for ZIP bundling).
 */
export async function capturePng(element: HTMLElement): Promise<Blob> {
  const dataUrl = await captureReactFlowPng(element)
  const res = await fetch(dataUrl)
  return res.blob()
}

/**
 * Bundles multiple files into a ZIP and triggers a browser download.
 */
export async function downloadZip(
  files: Array<{ name: string; blob: Blob }>,
  zipName: string,
): Promise<void> {
  const zip = new JSZip()
  for (const { name, blob } of files) {
    zip.file(name, blob)
  }
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Local storage ─────────────────────────────────────────────────────────────

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
