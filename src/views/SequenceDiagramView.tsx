import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import type { Diagram, PhaseId, SequenceParticipant, SequenceMessage } from '@/types'
import { generateId } from '@/lib/utils'
import { PhaseSwitcher } from '@/components/PhaseSwitcher'
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
import { Plus } from 'lucide-react'

const LIFELINE_WIDTH = 160
const LIFELINE_GAP = 40
const MESSAGE_HEIGHT = 48

const PHASE_ORDER: PhaseId[] = ['as-is', 'phase-1', 'phase-2']

function resolveSequence(
  diagram: Diagram,
  phase: PhaseId,
): { participants: SequenceParticipant[]; messages: SequenceMessage[] } {
  let participants = [...(diagram.baseParticipants ?? [])]
  let messages = [...(diagram.baseMessages ?? [])]
  const phaseIdx = PHASE_ORDER.indexOf(phase)

  for (let i = 1; i <= phaseIdx; i++) {
    const ps = diagram.sequencePhases?.[PHASE_ORDER[i]]
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

  const [activePhase, setActivePhase] = useState<PhaseId>('as-is')
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [showAddMessage, setShowAddMessage] = useState(false)
  const [participantLabel, setParticipantLabel] = useState('')
  const [msgFrom, setMsgFrom] = useState('')
  const [msgTo, setMsgTo] = useState('')
  const [msgLabel, setMsgLabel] = useState('')
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const liveDiagram = useStore((s) => s.project.diagrams?.find((d) => d.id === diagram.id) ?? diagram)
  const { participants, messages } = resolveSequence(liveDiagram, activePhase)

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
          <PhaseSwitcher activePhase={activePhase} onChange={setActivePhase} />
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
        </div>
      </div>

      {/* Diagram area */}
      <div className="flex-1 overflow-auto p-4">
        {participants.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Add participants to start building the sequence diagram.
          </div>
        ) : (
          <div style={{ width: totalWidth }}>
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
    </div>
  )
}
