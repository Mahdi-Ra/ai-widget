'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [newName, setNewName] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      loadProjects(data.user.id)
    })
  }, [])

  async function loadProjects(uid: string) {
    const res = await fetch(`/api/projects?userId=${uid}`)
    const data = await res.json()
    setProjects(data)
    loadStats(data)
  }

  async function loadStats(projects: any[]) {
    const statsMap: Record<string, number> = {}
    for (const p of projects) {
      const res = await fetch(`/api/stats?projectId=${p.id}`)
      const data = await res.json()
      statsMap[p.id] = data.conversations || 0
    }
    setStats(statsMap)
  }

  async function createProject() {
    if (!newName.trim()) return
    setLoading(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, userId })
    })
    setNewName('')
    await loadProjects(userId)
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      {/* هدر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700 }}>My Projects</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Manage your AI chat widgets</p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer', color: '#6b7280', fontSize: '14px' }}>
          Sign out
        </button>
      </div>

      {/* ساخت پروژه */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600 }}>New Project</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            placeholder="Project name (e.g. My Store, SaaS App)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProject()}
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff' }}
          />
          <button
            onClick={createProject}
            disabled={loading}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
          >
            {loading ? '...' : '+ Create'}
          </button>
        </div>
      </div>

      {/* لیست پروژه‌ها */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
          <p style={{ margin: 0, fontWeight: 600, color: '#6b7280' }}>No projects yet</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Create your first AI widget above</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => router.push(`/dashboard/${p.id}`)}
              style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: '#fff', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = '#6366f1' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb' }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Created {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>
                    {stats[p.id] ?? '...'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>conversations</div>
                </div>
                <span style={{ color: '#d1d5db', fontSize: '18px' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}