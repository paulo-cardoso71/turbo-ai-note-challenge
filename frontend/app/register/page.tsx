'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'

export default function RegisterPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register/', { email, password })
      login(res.data.email, res.data.tokens.access, res.data.tokens.refresh)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#F5ECD7' }}>

      {/* Cat illustration — matches Figma */}
      <div className="text-6xl mb-4">🐱</div>

      <h1 className="text-4xl font-serif mb-8"
        style={{ color: '#5C3D2E', fontFamily: 'Georgia, serif' }}>
        Yay, New Friend!
      </h1>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-3 rounded-full border-0 outline-none"
          style={{ backgroundColor: '#EDE0CC', color: '#5C3D2E' }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-3 rounded-full border-0 outline-none"
          style={{ backgroundColor: '#EDE0CC', color: '#5C3D2E' }}
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-full font-medium mt-2 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: '#F5ECD7', color: '#5C3D2E', border: '1.5px solid #5C3D2E' }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <Link href="/login"
          className="text-center text-sm mt-1 hover:underline"
          style={{ color: '#5C3D2E' }}>
          We're already friends! →
        </Link>
      </div>
    </div>
  )
}