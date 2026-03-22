import { useState, useCallback, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useStore } from '@/store'
import type { Diagram, PhaseId, SequenceParticipant, SequenceMessage } from '@/types'
import { generateId } from '@/lib/utils'
import { getPhaseOrder } from '@/lib/diagram-phase'
import { PhaseSwitcher } from '@/components/PhaseSwitcher'
import { PhaseEditorPopover } from '@/components/PhaseEditorPopover'
import { MermaidImportDialog } from '@/components/MermaidImportDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, FileCode2, Image, Archive, Eye, EyeOff, GripVertical } from 'lucide-react'
import { toPng } from 'html-to-image'
import { downloadZip, toSafeFilename } from '@/lib/project-io'

const LIFELINE_WIDTH = 160
const LIFELINE_GAP = 40
const MESSAGE_HEIGHT = 48

/** Returns all participants/messages up to the given phase WITHOUT filtering hidden elements. */
function resolveSequenceAll(
  diagram: Diagram,
  phase: PhaseId,
): { participants: SequenceParticipant[]; messages: SequenceMessage[] } {
  let participants = [...(diagram.baseParticipants ?? [])]
  let messages = [...(diagram.baseMessages ?? [])]
  const phaseOrder = getPhaseOrder(diagram)
  const phaseIdx = phaseOrder.findIndex((p) => p.id === phase)

  for (let i = 1; i <= phaseIdx; i++) {
    const ps = diagram.sequencePhases?.[phaseOrder[i].id]
    if (!ps) continue
    participants = [...participants, ...ps.addedParticipants]
    messages = [...messages, ...ps.addedMessages]
  }

  return {
    participants: [...participants].sort((a, b) => a.order - b.order),
    messages: [...messages].sort((a, b) => a.order - b.order),
  }
}

function resolveSequence(
  diagram: Diagram,
  phase: PhaseId,
): { participants: SequenceParticipant[]; messages: SequenceMessage[] } {
  let participants = [...(diagram.baseParticipants ?? [])]
  let messages = [...(diagram.baseMessages ?? [])]
  const phaseOrder = getPhaseOrder(diagram)
  const phaseIdx = phaseOrder.findIndex((p) => p.id === phase)

  for (let i = 1; i <= phaseIdx; i++) {
    const ps = diagram.sequencePhases?.[phaseOrder[i].id]
    if (!ps) continue
    participants = [...participants, ...ps.addedParticipants].filter(
      (p) => !ps.hiddenParticipantIds.includes(p.id),
    )
    messages = [...messages, ...ps.addedMessages].filter(
      (m) => !ps.hiddenMessageIds.includes(m.id),
    )
  }

  return {
    participants: [...participants].sort((a, b) => a.order - b.order),
    messages: [...messages].sort((a, b) => a.order - b.order),
  }
}

interface Props {
  diagram: Diagram
}

export function SequenceDiagramView({ diagram }: Props) {
  const addSequenceParticipant = useStore((s) => s.addSequenceParticipant)
  const addSequenceMessage = useStore((s) => s.addSequenceMessage)
  const reorderSequenceParticipants = useStore((s) => s.reorderSequenceParticipants)
  const toggleHideSequenceParticipant = useStore((s) => s.toggleHideSequenceParticipant)
  const toggleHideSequenceMessage = useStore((s) => s.toggleHideSequenceMessage)
  const reorderSequenceMessages = useStore((s) => s.reorderSequenceMessages)

  const [activePhase, setActivePhase] = useState<PhaseId>('as-is')
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [showAddMessage, setShowAddMessage] = useState(false)
  const [showMermaidImport, setShowMermaidImport] = useState(false)
  const [participantLabel, setParticipantLabel] = useState('')
  const [msgFrom, setMsgFrom] = useState('')
  const [msgTo, setMsgTo] = useState('')
  const [msgLabel, setMsgLabel] = useState('')
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [dragOverMsgIdx, setDragOverMsgIdx] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const diagramRef = useRef<HTMLDivElement>(null)

  const liveDiagram = useStore((s) => s.project.diagrams?.find((d) => d.id === diagram.id) ?? diagram)

  // Reset to base phase if the currently active phase is deleted
  useEffect(() => {
    const phaseIds = getPhaseOrder(liveDiagram).map((p) => p.id)
    if (!phaseIds.includes(activePhase)) {
      setActivePhase('as-is')
    }
  }, [liveDiagram, activePhase])

  const { participants, messages } = resolveSequence(liveDiagram, activePhase)
  const { participants: allParticipants, messages: allMessages } = resolveSequenceAll(liveDiagram, activePhase)
  const currentPhaseState = liveDiagram.sequencePhases?.[activePhase]
  const hiddenParticipantIds = currentPhaseState?.hiddenParticipantIds ?? []
  const hiddenMessageIds = currentPhaseState?.hiddenMessageIds ?? []
  const isAsIs = activePhase === 'as-is'

  function handleAddParticipant() {
    if (!participantLabel.trim()) return
    const p: SequenceParticipant = {
      id: generateId(),
      label: participantLabel.trim(),
      order: participants.length,
    }
    addSequenceParticipant(diagram.id, activePhase, p)
    setParticipantLabel('')
    setShowAddParticipant(false)
  }

  function handleAddMessage() {
    if (!msgFrom || !msgTo || !msgLabel.trim()) return
    const m: SequenceMessage = {
      id: generateId(),
      from: msgFrom,
      to: msgTo,
      label: msgLabel.trim(),
      order: messages.length,
    }
    addSequenceMessage(diagram.id, activePhase, m)
    setMsgFrom('')
    setMsgTo('')
    setMsgLabel('')
    setShowAddMessage(false)
  }

  function handleMermaidImport(importedParticipants: SequenceParticipant[], importedMessages: SequenceMessage[]) {
    const baseOrder = participants.length
    for (let i = 0; i < importedParticipants.length; i++) {
      addSequenceParticipant(diagram.id, activePhase, {
        ...importedParticipants[i],
        order: baseOrder + i,
      })
    }
    const msgBaseOrder = messages.length
    for (let i = 0; i < importedMessages.length; i++) {
      addSequenceMessage(diagram.id, activePhase, {
        ...importedMessages[i],
        order: msgBaseOrder + i,
      })
    }
  }

  async function handleExportPng() {
    const container = diagramRef.current
    if (!container) return
    setIsExporting(true)
    try {
      const safeName = toSafeFilename(liveDiagram.name)
      await toPng(container, { backgroundColor: '#ffffff' }) // warm-up
      const dataUrl = await toPng(container, { backgroundColor: '#ffffff' })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${safeName}-${activePhase}.png`
      a.click()
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportAllPhases() {
    const container = diagramRef.current
    if (!container) return
    setIsExporting(true)
    const originalPhase = activePhase
    const safeName = toSafeFilename(liveDiagram.name)
    const phases = getPhaseOrder(liveDiagram)
    const files: { name: string; blob: Blob }[] = []
    try {
      for (const phase of phases) {
        flushSync(() => setActivePhase(phase.id))
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        const dataUrl = await toPng(container, { backgroundColor: '#ffffff' })
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        files.push({ name: `${safeName}-${phase.id}.png`, blob })
      }
      await downloadZip(files, `${safeName}-all-phases.zip`)
    } finally {
      setActivePhase(originalPhase)
      setIsExporting(false)
    }
  }

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetIdx: number) => {
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'))
      if (fromIdx === targetIdx) return
      reorderSequenceParticipants(diagram.id, activePhase, fromIdx, targetIdx)
      setDragOverIdx(null)
    },
    [diagram.id, activePhase, reorderSequenceParticipants],
  )

  const totalWidth = Math.max(participants.length * (LIFELINE_WIDTH + LIFELINE_GAP), 400)
  const svgHeight = Math.max(messages.length * MESSAGE_HEIGHT + 40, 120)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-card shrink-0">
        <span className="font-medium text-sm">{diagram.name}</span>
        <span className="text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded">Sequence</span>
        <div className="ml-auto flex items-center gap-2">
          <PhaseSwitcher phases={getPhaseOrder(liveDiagram)} activePhase={activePhase} onChange={setActivePhase} />
          <PhaseEditorPopover diagramId={diagram.id} phases={getPhaseOrder(liveDiagram)} />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowMermaidImport(true)}>
            <FileCode2 className="h-3 w-3 mr-1" /> Import
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAddParticipant(true)}>
            <Plus className="h-3 w-3 mr-1" /> Participant
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setShowAddMessage(true)}
            disabled={participants.length < 2}
          >
            <Plus className="h-3 w-3 mr-1" /> Message
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleExportPng}
            disabled={isExporting || participants.length === 0}
          >
            <Image className="h-3 w-3 mr-1" /> PNG
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleExportAllPhases}
            disabled={isExporting || participants.length === 0}
          >
            <Archive className="h-3 w-3 mr-1" /> All Phases
          </Button>
        </div>
      </div>

      {/* Visibility panel — only shown in non-as-is phases */}
      {!isAsIs && allParticipants.length > 0 && (
        <div className="border-b px-3 py-2 bg-muted/30 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium w-20 shrink-0">Participants</span>
              {allParticipants.map((p) => {
                const hidden = hiddenParticipantIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleHideSequenceParticipant(diagram.id, activePhase, p.id)}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${
                      hidden
                        ? 'bg-muted text-muted-foreground border-muted-foreground/30 line-through opacity-50'
                        : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                    title={hidden ? 'Click to show' : 'Click to hide'}
                  >
                    {hidden ? <EyeOff className="h-3 w-3 shrink-0" /> : <Eye className="h-3 w-3 shrink-0" />}
                    {p.label}
                  </button>
                )
              })}
            </div>
            {allMessages.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium w-20 shrink-0">Messages</span>
                {allMessages.map((m, mIdx) => {
                  const hidden = hiddenMessageIds.includes(m.id)
                  const fromLabel = allParticipants.find((p) => p.id === m.from)?.label ?? m.from
                  const toLabel = allParticipants.find((p) => p.id === m.to)?.label ?? m.to
                  return (
                    <div
                      key={m.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(mIdx))}
                      onDragOver={(e) => { e.preventDefault(); setDragOverMsgIdx(mIdx) }}
                      onDragLeave={() => setDragOverMsgIdx(null)}
                      onDrop={(e) => {
                        const fromMsgIdx = parseInt(e.dataTransfer.getData('text/plain'))
                        if (fromMsgIdx !== mIdx) reorderSequenceMessages(diagram.id, activePhase, fromMsgIdx, mIdx)
                        setDragOverMsgIdx(null)
                      }}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors cursor-grab select-none ${
                        dragOverMsgIdx === mIdx
                          ? 'bg-blue-50 border-blue-400'
                          : hidden
                          ? 'bg-muted text-muted-foreground border-muted-foreground/30 opacity-50'
                          : 'bg-background text-foreground border-border hover:bg-accent'
                      }`}
                    >
                      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <button
                        onClick={() => toggleHideSequenceMessage(diagram.id, activePhase, m.id)}
                        className={hidden ? 'line-through flex items-center gap-1' : 'flex items-center gap-1'}
                        title={hidden ? 'Click to show' : 'Click to hide'}
                      >
                        {hidden ? <EyeOff className="h-3 w-3 shrink-0" /> : <Eye className="h-3 w-3 shrink-0" />}
                        {fromLabel} → {toLabel}: {m.label}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagram area */}
      <div className="flex-1 overflow-auto p-4">
        {participants.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Add participants to start building the sequence diagram.
          </div>
        ) : (
          <div ref={diagramRef} style={{ width: totalWidth }}>
            {/* HTML participant header row (supports native drag) */}
            <div className="flex mb-0" style={{ gap: LIFELINE_GAP }}>
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`flex items-center justify-center rounded border-2 cursor-grab select-none transition-colors ${
                    dragOverIdx === idx
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-white border-gray-300'
                  }`}
                  style={{ width: LIFELINE_WIDTH, height: 40, flexShrink: 0 }}
                  title="Drag to reorder"
                >
                  <span className="text-xs font-semibold text-gray-800 truncate px-2">{p.label}</span>
                </div>
              ))}
            </div>

            {/* SVG for lifelines and messages */}
            <svg width={totalWidth} height={svgHeight} className="overflow-visible">
              {/* Lifelines */}
              {participants.map((p, idx) => {
                const cx = idx * (LIFELINE_WIDTH + LIFELINE_GAP) + LIFELINE_WIDTH / 2
                return (
                  <line
                    key={p.id}
                    x1={cx}
                    y1={0}
                    x2={cx}
                    y2={svgHeight - 8}
                    stroke="#9ca3af"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                )
              })}

              {/* Messages */}
              {messages.map((msg, mIdx) => {
                const fromIdx = participants.findIndex((p) => p.id === msg.from)
                const toIdx = participants.findIndex((p) => p.id === msg.to)
                if (fromIdx === -1 || toIdx === -1) return null
                const y = 16 + mIdx * MESSAGE_HEIGHT
                const x1 = fromIdx * (LIFELINE_WIDTH + LIFELINE_GAP) + LIFELINE_WIDTH / 2
                const x2 = toIdx * (LIFELINE_WIDTH + LIFELINE_GAP) + LIFELINE_WIDTH / 2
                const midX = (x1 + x2) / 2
                const dir = x2 >= x1 ? 1 : -1

                return (
                  <g key={msg.id}>
                    <line x1={x1} y1={y} x2={x2 - dir * 10} y2={y} stroke="#374151" strokeWidth={1.5} />
                    <polygon
                      points={`${x2},${y} ${x2 - dir * 10},${y - 5} ${x2 - dir * 10},${y + 5}`}
                      fill="#374151"
                    />
                    <text x={midX} y={y - 7} textAnchor="middle" fontSize={11} fill="#374151">
                      {msg.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Add Participant Dialog */}
      {showAddParticipant && (
        <Dialog open onOpenChange={() => setShowAddParticipant(false)}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
            <div className="py-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={participantLabel}
                onChange={(e) => setParticipantLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddParticipant() }}
                autoFocus
                className="mt-1 h-8 text-sm"
              />
            </div>
            <DialogFooter>
              <Button size="sm" variant="ghost" onClick={() => setShowAddParticipant(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddParticipant}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Message Dialog */}
      {showAddMessage && (
        <Dialog open onOpenChange={() => setShowAddMessage(false)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Add Message</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div>
                <Label className="text-xs">From</Label>
                <Select value={msgFrom} onValueChange={setMsgFrom}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Select value={msgTo} onValueChange={setMsgTo}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={msgLabel}
                  onChange={(e) => setMsgLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddMessage() }}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="ghost" onClick={() => setShowAddMessage(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddMessage}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Mermaid Import Dialog */}
      {showMermaidImport && (
        <MermaidImportDialog
          diagramType="sequence"
          onImport={() => {}}
          onImportSequence={handleMermaidImport}
          onClose={() => setShowMermaidImport(false)}
        />
      )}
    </div>
  )
}
