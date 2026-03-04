'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Note, Category } from '@/types'

interface Props {
  note: Note | null
  categories: Category[]
  onClose: () => void
}

export default function NoteModal({ note, categories, onClose }: Props) {

    const defaultCategory = categories.find(c => c.name === 'Random Thoughts')

  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [categoryId, setCategoryId] = useState<number | null>(note?.category || defaultCategory?.id || null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [savedNoteId, setSavedNoteId] = useState<string | null>(note?.id || null)
  const [isSaving, setIsSaving] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  const selectedCategory = categories.find(c => c.id === categoryId)
  const cardColor = selectedCategory?.color || '#F0E6D3'

  // ─── Auto-save logic ───────────────────────────────────────────
  const performSave = useCallback(async (
    t: string, c: string, catId: number | null, existingId: string | null
  ) => {
    // Don't save completely empty notes
    if (!t.trim() && !c.trim()) return

    setIsSaving(true)
    try {
      const payload = { title: t, content: c, category: catId }
      if (existingId) {
        await api.patch(`/notes/${existingId}/`, payload)
      } else {
        const res = await api.post('/notes/', payload)
        // Store the new note's ID so subsequent saves use PATCH
        setSavedNoteId(res.data.id)
      }
    } catch (e) {
      console.error('Auto-save failed', e)
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Trigger auto-save 1 second after user stops typing
  useEffect(() => {
    // Skip the very first render — don't save on open
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      performSave(title, content, categoryId, savedNoteId)
    }, 1000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [title, content, categoryId])

  // Save immediately when modal closes (catches any unsaved state)
  const handleClose = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    await performSave(title, content, categoryId, savedNoteId)
    onClose()
  }

  // ─── Delete ────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/notes/${savedNoteId}/`),
    onSuccess: onClose,
  })

  // ─── Date format ───────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    })
  }

  // ─── Audio recording ──────────────────────────────────────────
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    audioChunks.current = []

    mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data)
    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
      await transcribeAudio(blob)
      stream.getTracks().forEach(t => t.stop())
    }

    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      const res = await api.post('/notes/transcribe/', formData)
      setContent(prev => prev ? `${prev}\n${res.data.text}` : res.data.text)
    } catch (e) {
      console.error('Transcription failed', e)
    } finally {
      setTranscribing(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#F5ECD7' }}
    >
      {/* Top bar — outside the card */}
      <div className="flex items-center justify-between px-6 py-3">

        {/* Category dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border"
            style={{
              borderColor: selectedCategory?.color || '#5C3D2E',
              backgroundColor: selectedCategory?.color || 'transparent',
              color: '#5C3D2E'
            }}
          >
            {selectedCategory && (
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
            )}
            {selectedCategory?.name || 'No Category'}
            <span className="opacity-60">▾</span>
          </button>

          {showCategoryDropdown && (
            <div
              className="absolute top-9 left-0 rounded-xl shadow-lg py-1 z-10 min-w-40"
              style={{ backgroundColor: '#EDE0CC' }}
            >
              <button
                onClick={() => { setCategoryId(null); setShowCategoryDropdown(false) }}
                className="w-full text-left px-4 py-2 text-sm hover:opacity-70"
                style={{ color: '#5C3D2E' }}
              >
                No Category
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); setShowCategoryDropdown(false) }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:opacity-70"
                  style={{ color: '#5C3D2E' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side: saving indicator + delete + close */}
        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="text-xs opacity-40" style={{ color: '#5C3D2E' }}>
              saving...
            </span>
          )}
          {transcribing && (
            <span className="text-xs opacity-40" style={{ color: '#5C3D2E' }}>
              transcribing...
            </span>
          )}
          {savedNoteId && (
            <button
              onClick={() => deleteMutation.mutate()}
              className="text-xs opacity-40 hover:opacity-80 transition-opacity"
              style={{ color: '#5C3D2E' }}
            >
              🗑 Delete
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-xl opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: '#5C3D2E' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Card — takes remaining height */}
      <div
        className="flex-1 mx-6 mb-6 rounded-2xl p-8 flex flex-col relative overflow-hidden"
        style={{ backgroundColor: cardColor }}
      >
        {/* Last edited */}
        {note && (
          <p className="text-xs opacity-40 text-right mb-6" style={{ color: '#5C3D2E' }}>
            Last Edited: {formatDate(note.updated_at)}
          </p>
        )}

        {/* Title */}
        <input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-2xl font-bold mb-4"
          style={{ color: '#3D2B1F', fontFamily: 'Georgia, serif' }}
        />

        {/* Content */}
        <textarea
          placeholder="Pour your heart out..."
          value={content}
          onChange={e => setContent(e.target.value)}
          className="flex-1 w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
          style={{ color: '#5C3D2E' }}
        />

        {/* Audio toolbar — bottom right, matches Figma exactly */}
        <div className="absolute bottom-6 right-6">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full"
            style={{
              backgroundColor: isRecording ? '#E85D5D' : `${cardColor}CC`,
              border: `1.5px solid ${isRecording ? '#E85D5D' : '#5C3D2E'}40`
            }}
          >
            {/* Mic button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className="text-lg hover:opacity-70 transition-opacity"
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              🎙
            </button>

            {isRecording && (
              <>
                {/* Stop/hang up */}
                <button
                  onClick={stopRecording}
                  className="text-lg hover:opacity-70"
                >
                  📵
                </button>
                {/* Waveform indicator */}
                <span className="text-xs opacity-60" style={{ color: '#5C3D2E' }}>
                  ▂▄▆▄▂
                </span>
              </>
            )}

            {/* Headphones icon — always visible */}
            <span className="text-lg opacity-60">🎧</span>
          </div>
        </div>
      </div>
    </div>
  )
}
