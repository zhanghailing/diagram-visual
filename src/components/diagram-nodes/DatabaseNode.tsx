import { Handle, Position, type NodeProps } from '@xyflow/react'

export function DatabaseNode({ data, selected }: NodeProps) {
  const label = String(data.label ?? '')
  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 bg-card text-foreground min-w-[100px] max-w-[160px] ${selected ? 'outline outline-2 outline-primary' : ''}`}
      style={{ borderRadius: '50% / 10px 10px 0 0', border: '2px solid hsl(var(--border))', borderTop: 'none' }}
    >
      {/* Cylinder top ellipse */}
      <div
        className="absolute -top-2 left-0 right-0 h-4 rounded-full border-2 border-border bg-card"
        style={{ position: 'relative', margin: '-12px -2px 0', borderRadius: '50%' }}
      />
      <span className="text-xs font-medium text-center mt-2">{label}</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  )
}
