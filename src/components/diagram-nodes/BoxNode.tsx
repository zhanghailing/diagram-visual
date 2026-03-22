import { Handle, Position, type NodeProps } from '@xyflow/react'

export function BoxNode({ data, selected }: NodeProps) {
  const label = String(data.label ?? '')
  return (
    <div
      className={`flex items-center justify-center p-3 rounded border-2 bg-card text-foreground min-w-[120px] max-w-[180px] ${selected ? 'border-primary' : 'border-border'}`}
    >
      <span className="text-xs font-medium text-center">{label}</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  )
}
