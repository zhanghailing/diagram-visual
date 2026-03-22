import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react'

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

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: '#999', strokeWidth: 1.5 }} />
      {(label || technology) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="flex flex-col items-center"
          >
            {label && <span className="text-[10px] bg-white border border-gray-200 rounded px-1">{String(label)}</span>}
            {technology && <span className="text-[9px] text-gray-400 italic">[{technology}]</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
