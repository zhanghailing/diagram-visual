import { Handle, Position, type NodeProps } from '@xyflow/react'

export function ActorNode({ data, selected }: NodeProps) {
  const label = String(data.label ?? '')
  return (
    <div className={`flex flex-col items-center gap-1 p-2 ${selected ? 'outline outline-2 outline-primary rounded' : ''}`}>
      <svg width="32" height="36" viewBox="0 0 32 36" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="16" cy="6" r="5" />
        <line x1="16" y1="11" x2="16" y2="24" />
        <line x1="6" y1="16" x2="26" y2="16" />
        <line x1="16" y1="24" x2="8" y2="34" />
        <line x1="16" y1="24" x2="24" y2="34" />
      </svg>
      <span className="text-xs text-center leading-tight">{label}</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  )
}
