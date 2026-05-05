'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type Tab = 'text' | 'url' | 'pdf'

export default function ProjectPage() {
  const { id } = useParams()
  const [tab, setTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/stats?projectId=${id}`)
      .then(r => r.json())
      .then(setStats)
  }, [id])

  async function ingest() {
    setLoading(true)
    setStatus('Processing...')

    try {
      let res

      if (tab === 'text') {
        res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: id, text, source })
        })
      } else if (tab === 'url') {
        res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: id, url })
        })
      } else if (tab === 'pdf' && file) {
        const formData = new FormData()
        formData.append('projectId', id as string)
        formData.append('file', file)
        res = await fetch('/api/ingest', { method: 'POST', body: formData })
      }

      const data = await res!.json()
      if (data.error) {
        setStatus(`❌ Error: ${data.error}`)
      } else {
        setStatus(`✅ Done! ${data.chunks} chunks saved from ${data.type}`)
        setText(''); setUrl(''); setFile(null); setSource('')
        // آپدیت آمار
        fetch(`/api/stats?projectId=${id}`).then(r => r.json()).then(setStats)
      }
    } catch (e) {
      setStatus('❌ Something went wrong')
    }

    setLoading(false)
  }

  const embedCode = `<script
  src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget.js"
  data-project-id="${id}"
  data-color="#6366f1"
  data-lang="en"
  data-url="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">
</script>`

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '8px 20px', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    background: tab === t ? '#6366f1' : '#f3f4f6',
    color: tab === t ? '#fff' : '#6b7280',
  })

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <a href="/dashboard" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '14px' }}>← Back</a>
      <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '20px 0 32px' }}>Project Settings</h1>

      {/* آنالیتیکس */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
        {[
          { label: 'Conversations', value: stats?.conversations ?? '...' },
          { label: 'Content Chunks', value: stats?.chunks ?? '...' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#6366f1' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* آپلود محتوا */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Upload Content</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button style={tabStyle('text')} onClick={() => setTab('text')}>📝 Text</button>
          <button style={tabStyle('url')} onClick={() => setTab('url')}>🌐 URL</button>
          <button style={tabStyle('pdf')} onClick={() => setTab('pdf')}>📄 PDF</button>
        </div>

        {tab === 'text' && (
          <>
            <input
              placeholder="Source name (e.g. FAQ, About Us)"
              value={source}
              onChange={e => setSource(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder="Paste your content here..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </>
        )}

        {tab === 'url' && (
          <input
            placeholder="https://yoursite.com/faq"
            value={url}
            onChange={e => setUrl(e.target.value)}
            style={inputStyle}
          />
        )}

        {tab === 'pdf' && (
          <div style={{
            border: '2px dashed #e5e7eb', borderRadius: '12px',
            padding: '40px', textAlign: 'center', cursor: 'pointer',
            background: file ? '#f0fdf4' : '#fafafa'
          }}
            onClick={() => document.getElementById('pdf-input')!.click()}
          >
            <input
              id="pdf-input" type="file" accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file
              ? <p style={{ color: '#16a34a', fontWeight: 600, margin: 0 }}>✅ {file.name}</p>
              : <p style={{ color: '#9ca3af', margin: 0 }}>Click to select PDF file</p>
            }
          </div>
        )}

        <button
          onClick={ingest}
          disabled={loading}
          style={{
            marginTop: '14px', background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: '8px', padding: '10px 24px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600, opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Processing...' : 'Process & Save'}
        </button>

        {status && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>{status}</p>
        )}
      </div>

      {/* کد embed */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Embed Code</h2>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Add this before the closing <code>&lt;/body&gt;</code> tag on your site:
        </p>
        <pre style={{
          background: '#f3f4f6', padding: '16px', borderRadius: '8px',
          fontSize: '13px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
        }}>
          {embedCode}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(embedCode)}
          style={{
            marginTop: '10px', background: '#f3f4f6', border: '1px solid #e5e7eb',
            borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontSize: '13px'
          }}
        >
          Copy Code
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: '12px',
  border: '1px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  fontFamily: 'system-ui',
}