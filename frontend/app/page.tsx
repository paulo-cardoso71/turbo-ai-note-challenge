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
    // Invalidate both queries so counts + grid both refresh
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

        <div className="flex justify-end mb-8">
          <button
            onClick={openNewNote}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border transition-opacity hover:opacity-70"
            style={{ borderColor: '#5C3D2E', color: '#5C3D2E' }}
          >
            + New Note
          </button>
        </div>

        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-24">
            <div className="text-8xl mb-6">🧋</div>
            <p className="text-lg" style={{ color: '#5C3D2E' }}>
              I&apos;m just here waiting for your charming notes...
            </p>
          </div>
        )}

        {notes.length > 0 && (
          <div className="masonry-grid">
            {notes.map(note => (
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