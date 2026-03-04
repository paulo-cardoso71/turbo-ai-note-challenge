'use client'

import { Note } from '@/types'

interface Props {
  note: Note
  onClick: () => void
}

// Default color if note has no category
const DEFAULT_COLOR = '#E8D5B7'

export default function NoteCard({ note, onClick }: Props) {
  const color = note.category_detail?.color || DEFAULT_COLOR

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md"
      style={{ backgroundColor: color }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs mb-3 opacity-70"
        style={{ color: '#5C3D2E' }}>
        <span>{formatDate(note.updated_at)}</span>
        {note.category_detail && (
          <span>{note.category_detail.name}</span>
        )}
      </div>

      {/* Title */}
      {note.title && (
        <h3 className="font-serif text-xl font-bold mb-2"
          style={{ color: '#3D2B1F', fontFamily: 'Georgia, serif' }}>
          {note.title}
        </h3>
      )}

      {/* Content preview — max 4 lines */}
      {note.content && (
        <p className="text-sm leading-relaxed line-clamp-4"
          style={{ color: '#5C3D2E' }}>
          {note.content}
        </p>
      )}
    </div>
  )
}