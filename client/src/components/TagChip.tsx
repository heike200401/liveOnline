import type { RecordTag } from '../types'

export function TagChip({ tag }: { tag: RecordTag }) {
  return (
    <span className="tag-chip" style={{ ['--tag-color' as string]: tag.color }}>
      {tag.name}
    </span>
  )
}
