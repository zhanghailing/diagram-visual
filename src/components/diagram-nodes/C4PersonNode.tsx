import { Handle, Position, type NodeProps } from '@xyflow/react'

export function C4PersonNode({ data, selected }: NodeProps) {
  const label = String(data.label ?? '')
  const description = String(data.description ?? '')
  return (
    <div
      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 bg-[#08427b] text-white min-w-[120px] max-w-[160px] ${selected ? 'border-blue-300' : 'border-[#073b6f]'}`}
    >
      {/* Person icon */}
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="7" r="4" />
        <path d="M12 14c-5 0-8 2.5-8 4v1h16v-1c0-1.5-3-4-8-4z" />
      </svg>
      <span className="text-xs font-semibold text-center leading-tight">{label}</span>
      {description && <span className="text-[10px] text-center opacity-80 leading-tight">{description}</span>}
      <span className="text-[9px] opacity-60">[Person]</span>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  )
}
