import { Handle, Position, type NodeProps } from '@xyflow/react'

export function QueueNode({ data, selected }: NodeProps) {
  const label = String(data.label ?? '')
  return (
    <div
      className={`flex items-center justify-center px-4 py-3 bg-amber-50 text-amber-900 border-2 min-w-[120px] max-w-[180px] ${selected ? 'border-amber-500' : 'border-amber-300'}`}
      style={{ borderRadius: '40px' }}
    >
      <span className="text-xs font-medium text-center">{label}</span>
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  )
}
