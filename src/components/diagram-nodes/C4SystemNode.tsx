import { Handle, Position, type NodeProps } from '@xyflow/react'

export function C4SystemNode({ data, selected }: NodeProps) {
  const label = String(data.label ?? '')
  const description = String(data.description ?? '')
  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded border-2 bg-[#1168bd] text-white min-w-[140px] max-w-[180px] ${selected ? 'border-blue-300' : 'border-[#0e5ca8]'}`}
    >
      <span className="text-xs font-bold text-center leading-tight">{label}</span>
      {description && <span className="text-[10px] text-center opacity-80 leading-tight">{description}</span>}
      <span className="text-[9px] opacity-60">[Software System]</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
    </div>
  )
}
