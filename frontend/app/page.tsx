'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import api from '@/lib/api'
import { Note, Category } from '@/types'
import Sidebar from '@/components/Sidebar'
import NoteCard from '@/components/NoteCard'
import NoteModal from '@/components/NoteModal'

export default function Dashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Guard: redirect to login if no token
  useEffect(() => {
    if (!Cookies.get('access_token')) {
      router.push('/login')
    }
  }, [router])

  // Categories — fetched once, rarely changes
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data),
  })

  // ALL notes — used for sidebar counts only, never filtered
  const { data: allNotes = [] } = useQuery<Note[]>({
    queryKey: ['notes-all'],
    queryFn: () => api.get('/notes/').then(r => r.data),
    staleTime: 0,
  })

  // FILTERED notes — what shows in the grid
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory
        ? `/notes/?category=${selectedCategory}`
        : '/notes/'
      return api.get(url).then(r => r.data)
    },
    staleTime: 0,
  })

  // Client-side search — fast, no extra API calls
  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      note.title?.toLowerCase().includes(q) ||
      note.content?.toLowerCase().includes(q)
    )
  })

  const handleSelectCategory = (id: number | null) => {
    setSelectedCategory(id)
  }

  const openNewNote = () => {
    setEditingNote(null)
    setIsModalOpen(true)
  }

  const openEditNote = (note: Note) => {
    setEditingNote(note)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingNote(null)
    queryClient.invalidateQueries({ queryKey: ['notes'] })
    queryClient.invalidateQueries({ queryKey: ['notes-all'] })
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5ECD7' }}>

      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        notes={allNotes}
      />

      <main className="flex-1 p-8">

        {/* Header — search + new note */}
        <div className="flex items-center justify-between mb-8">

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#5C3D2E" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full text-sm outline-none"
              style={{
                backgroundColor: 'rgba(92, 61, 46, 0.08)',
                color: '#5C3D2E',
                border: '1px solid rgba(92, 61, 46, 0.15)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                style={{ color: '#5C3D2E' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* New Note button */}
          <button
            onClick={openNewNote}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border transition-opacity hover:opacity-70 ml-4"
            style={{ borderColor: '#5C3D2E', color: '#5C3D2E' }}
          >
            + New Note
          </button>
        </div>

        {/* Empty state */}
        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-24">
            <div className="text-8xl mb-6">🧋</div>
            <p className="text-lg" style={{ color: '#5C3D2E' }}>
              {searchQuery
                ? `No notes found for "${searchQuery}"`
                : "I'm just here waiting for your charming notes..."}
            </p>
          </div>
        )}

        {/* Masonry grid */}
        {filteredNotes.length > 0 && (
          <div className="masonry-grid">
            {filteredNotes.map(note => (
              <div key={note.id} className="masonry-item">
                <NoteCard
                  note={note}
                  onClick={() => openEditNote(note)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <NoteModal
          note={editingNote}
          categories={categories}
          onClose={closeModal}
        />
      )}
    </div>
  )
}