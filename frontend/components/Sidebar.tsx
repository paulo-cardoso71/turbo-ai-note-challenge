'use client'

import { Note, Category } from '@/types'
import { useAuth } from '@/context/AuthContext'

interface Props {
  categories: Category[]
  selectedCategory: number | null
  onSelectCategory: (id: number | null) => void
  notes: Note[]
}

export default function Sidebar({ categories, selectedCategory, onSelectCategory, notes }: Props) {
  const { logout } = useAuth()

  const countForCategory = (id: number) =>
  notes.filter(n => {
    // Handle both cases: category as ID or as object
    if (typeof n.category === 'object' && n.category !== null) {
      return (n.category as Category).id === id
    }
    return n.category === id
  }).length

  return (
    <aside className="w-52 p-6 flex flex-col gap-1 shrink-0">

      {/* All categories */}
      <button
        onClick={() => onSelectCategory(null)}
        className="text-left text-sm font-semibold mb-3 hover:opacity-70 transition-opacity"
        style={{ color: '#5C3D2E' }}
      >
        All Categories
      </button>

      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className="flex items-center justify-between text-sm py-1 px-2 rounded-lg transition-all hover:opacity-70"
          style={{
            color: '#5C3D2E',
            backgroundColor: selectedCategory === cat.id ? `${cat.color}40` : 'transparent',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Color dot */}
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </div>
          <span className="text-xs opacity-60">
            {countForCategory(cat.id)}
          </span>
        </button>
      ))}

      {/* Logout at bottom */}
      <button
        onClick={logout}
        className="mt-auto text-xs opacity-40 hover:opacity-70 text-left pt-8"
        style={{ color: '#5C3D2E' }}
      >
        Log out
      </button>
    </aside>
  )
}