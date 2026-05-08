'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb', fontFamily: 'system-ui'
    }}>
      <div style={{
        background: '#fff', padding: '40px', borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '360px'
      }}>
        <h1 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 600 }}>
          {isSignup ? 'Sign Up' : 'Sign In'}
        </h1>

        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={inputStyle}
        />

        {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '16px' }}>
          {isSignup ? 'Sign Up' : 'Sign In'}{' '}
          <span
            onClick={() => setIsSignup(!isSignup)}
            style={{ color: '#6366f1', cursor: 'pointer' }}
          >
            {isSignup ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: '12px',
  border: '1px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box', outline: 'none'
}

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '11px', background: '#6366f1',
  color: '#fff', border: 'none', borderRadius: '8px',
  fontSize: '15px', fontWeight: 600, cursor: 'pointer'
}