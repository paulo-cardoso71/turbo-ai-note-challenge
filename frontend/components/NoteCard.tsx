'use client'

import { Note } from '@/types'

interface Props {
  note: Note
  onClick: () => void
}

const DEFAULT_COLOR = '#E8D5B7'

export default function NoteCard({ note, onClick }: Props) {
  const color = note.category_detail?.color || DEFAULT_COLOR

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor(
      (now.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0))
      / (1000 * 60 * 60 * 24)
    )
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={onClick}
      className="rounded-[24px] p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: color,
        boxShadow: '0 2px 8px rgba(92, 61, 46, 0.10)',
         border: '1px solid rgba(92, 61, 46, 0.08)'
      }}
    >
      {/* Meta row */}
      <div
        className="flex items-center gap-2 text-xs mb-3"
        style={{ color: '#5C3D2E', opacity: 0.65 }}
      >
        <span className="font-medium">{formatDate(note.updated_at)}</span>
        {note.category_detail && (
          <>
            <span>·</span>
            <span>{note.category_detail.name}</span>
          </>
        )}
      </div>

      {/* Title */}
      {note.title && (
        <h3
          className="text-xl font-bold mb-2 leading-snug"
          style={{ color: '#3D2B1F', fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          {note.title}
        </h3>
      )}

      {/* Content preview */}
      {note.content && (
        <p
          className="text-sm leading-relaxed line-clamp-4"
          style={{ color: '#5C3D2E' }}
        >
          {note.content}
        </p>
      )}
    </div>
  )
}