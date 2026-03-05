'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import Link from 'next/link'

export default function RegisterPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register/', { email, password })
      login(res.data.email, res.data.tokens.access, res.data.tokens.refresh)
    } catch (err) {
  const error = err as { response?: { data?: { error?: string } } }
  setError(error.response?.data?.error || 'Something went wrong')
} finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#F5ECD7' }}
    >
      {/* Illustration */}
      <div className="mb-2 text-7xl select-none">🐱</div>

      <h1
        className="text-4xl mb-8 tracking-tight"
        style={{ color: '#5C3D2E', fontFamily: 'Georgia, serif' }}
      >
        Yay, New Friend!
      </h1>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full px-5 py-3 rounded-2xl outline-none text-sm"
          style={{
            backgroundColor: '#EDE0CC',
            color: '#5C3D2E',
            border: 'none',
          }}
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-5 py-3 rounded-2xl outline-none text-sm"
            style={{
              backgroundColor: '#EDE0CC',
              color: '#5C3D2E',
              border: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs opacity-40 hover:opacity-70"
            style={{ color: '#5C3D2E' }}
          >
            {showPassword ? 'hide' : 'show'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-2xl text-sm font-semibold mt-1 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            backgroundColor: 'transparent',
            color: '#5C3D2E',
            border: '1.5px solid #5C3D2E',
          }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <Link
          href="/login"
          className="text-center text-xs mt-1 hover:underline opacity-60"
          style={{ color: '#5C3D2E' }}
        >
          We&apos;re already friends!
        </Link>
      </div>
    </div>
  )
}