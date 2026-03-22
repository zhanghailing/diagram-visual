import { useCallback, useRef, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react'
import { useStore } from '@/store'

export function RelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const technology = data?.technology as string | undefined
  const storedOffset = data?.labelOffset as { x: number; y: number } | undefined
  const diagramId = data?.diagramId as string | undefined

  const updateLabelOffset = useStore((s) => s.updateDiagramEdgeLabelOffset)

  // Local drag state — tracks live offset during drag before committing to store
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null)
  const dragStart = useRef<{ pointerX: number; pointerY: number; baseX: number; baseY: number } | null>(null)

  const offsetX = (storedOffset?.x ?? 0) + (dragDelta?.x ?? 0)
  const offsetY = (storedOffset?.y ?? 0) + (dragDelta?.y ?? 0)

  const finalX = labelX + offsetX
  const finalY = labelY + offsetY

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      baseX: storedOffset?.x ?? 0,
      baseY: storedOffset?.y ?? 0,
    }
    setDragDelta({ x: 0, y: 0 })
  }, [storedOffset])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return
    setDragDelta({
      x: e.clientX - dragStart.current.pointerX,
      y: e.clientY - dragStart.current.pointerY,
    })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.pointerX
    const dy = e.clientY - dragStart.current.pointerY
    const newOffset = {
      x: dragStart.current.baseX + dx,
      y: dragStart.current.baseY + dy,
    }
    dragStart.current = null
    setDragDelta(null)
    if (diagramId) {
      updateLabelOffset(diagramId, id, newOffset)
    }
  }, [diagramId, id, updateLabelOffset])

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: '#999', strokeWidth: 1.5 }} />
      {(label || technology) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${finalX}px,${finalY}px)`,
              pointerEvents: 'all',
              cursor: dragDelta ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            className="flex flex-col items-center"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {label && <span className="text-[10px] bg-white border border-gray-200 rounded px-1">{String(label)}</span>}
            {technology && <span className="text-[9px] text-gray-400 italic">[{technology}]</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
