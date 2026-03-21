import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Component } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  frontend: 'border-blue-400 bg-blue-50',
  backend: 'border-green-400 bg-green-50',
  library: 'border-purple-400 bg-purple-50',
  gateway: 'border-orange-400 bg-orange-50',
  platform: 'border-teal-400 bg-teal-50',
  other: 'border-gray-400 bg-gray-50',
}

const TYPE_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
  frontend: 'secondary',
  backend: 'secondary',
  library: 'secondary',
  gateway: 'secondary',
  platform: 'secondary',
  other: 'outline',
}

export const ComponentNode = memo(function ComponentNode({
  data,
  selected,
}: NodeProps & { data: Component }) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 p-3 min-w-[140px] max-w-[220px] shadow-sm bg-white',
        TYPE_COLORS[data.type] ?? TYPE_COLORS.other,
        selected && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />

      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <span className="font-semibold text-sm leading-tight">{data.name}</span>
          <Badge variant={TYPE_BADGE[data.type] ?? 'outline'} className="text-xs shrink-0">
            {data.type}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {data.states.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'text-xs px-1.5 py-0.5 rounded border',
                i === 0
                  ? 'bg-white border-gray-300 text-gray-600'
                  : 'bg-white border-gray-200 text-gray-500',
              )}
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  )
})
