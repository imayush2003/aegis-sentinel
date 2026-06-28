import { useState, useEffect } from 'react'
import { Terminal, Copy, Check, Info, ShieldAlert, Zap, Server } from 'lucide-react'

const SHELL_TYPES = [
  { id: 'bash', label: 'Bash TCP', os: ['linux', 'macos'], desc: 'Standard interactive bash reverse shell.' },
  { id: 'netcat', label: 'Netcat FIFO', os: ['linux', 'macos'], desc: 'FIFO pipe netcat connection for non-GAP systems.' },
  { id: 'powershell', label: 'PowerShell TCP', os: ['windows'], desc: 'One-liner .NET socket client channel.' },
  { id: 'python', label: 'Python Socket', os: ['linux', 'windows', 'macos'], desc: 'Cross-platform python socket reverse connection.' },
  { id: 'php', label: 'PHP fsockopen', os: ['linux', 'macos'], desc: 'Common web application remote shell channel.' },
  { id: 'perl', label: 'Perl Socket', os: ['linux', 'macos'], desc: 'Traditional Unix perl reverse link.' },
]

function GeneratorView({ fetchWithAuth }) {
  const [lhost, setLhost] = useState('10.10.10.15')
  const [lport, setLport] = useState('4444')
  const [selectedOS, setSelectedOS] = useState('linux')
  const [selectedShell, setSelectedShell] = useState('bash')
  const [encoding, setEncoding] = useState('raw')
  const [payload, setPayload] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchPayload = async () => {
    if (!lhost || !lport) return
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lhost,
          lport: parseInt(lport),
          shell_type: selectedShell,
          encoding
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPayload(data.payload)
      } else {
        setPayload('// Error generating payload from server')
      }
    } catch {
      // Offline fallback
      setPayload(`// Offline fallback\n# lhost: ${lhost}, lport: ${lport}, shell: ${selectedShell}, enc: ${encoding}`)
    }
    setLoading(false)
  }

  // Fetch payload when inputs or selections change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayload()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [lhost, lport, selectedShell, encoding])

  // Automatically select a valid shell when OS changes
  const handleOSChange = (os) => {
    setSelectedOS(os)
    const validShells = SHELL_TYPES.filter(s => s.os.includes(os))
    if (validShells.length > 0 && !validShells.find(s => s.id === selectedShell)) {
      setSelectedShell(validShells[0].id)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getFilteredShells = () => {
    return SHELL_TYPES.filter(s => s.os.includes(selectedOS))
  }

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Payload Configuration */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Terminal size={16} className="card-icon" />
              Target & Network Configuration
            </div>
          </div>

          <div className="input-row" style={{ marginBottom: 16 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>LHOST (Your Listener IP)</label>
              <input
                id="gen-lhost"
                className="input-field"
                value={lhost}
                onChange={e => setLhost(e.target.value)}
                placeholder="e.g. 192.168.1.5"
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>LPORT (Your Listener Port)</label>
              <input
                id="gen-lport"
                className="input-field"
                type="number"
                value={lport}
                onChange={e => setLport(e.target.value)}
                placeholder="4444"
                min="1"
                max="65535"
              />
            </div>
          </div>

          {/* OS Selector Tabs */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Target Operating System
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['linux', 'windows', 'macos'].map(os => (
                <button
                  key={os}
                  onClick={() => handleOSChange(os)}
                  className={`btn btn-sm ${selectedOS === os ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ textTransform: 'capitalize', flex: 1 }}
                >
                  {os}
                </button>
              ))}
            </div>
          </div>

          {/* Shell Type Grid */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Payload Channel Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {getFilteredShells().map(shell => (
                <button
                  key={shell.id}
                  onClick={() => setSelectedShell(shell.id)}
                  className={`filter-pill ${selectedShell === shell.id ? 'active' : ''}`}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', height: 'auto', display: 'block' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{shell.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shell.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Encoding Options */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Payload Encoding Method
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'raw', label: 'Raw Command' },
                { id: 'base64', label: 'Base64 Encoded' },
                { id: 'url', label: 'URL Encoded' }
              ].map(enc => (
                <button
                  key={enc.id}
                  onClick={() => setEncoding(enc.id)}
                  className={`filter-pill ${encoding === enc.id ? 'active' : ''}`}
                  style={{ flex: 1, padding: '8px' }}
                >
                  {enc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generated Console & Listener Instructions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <div className="card-title">
                <Zap size={16} className="card-icon" />
                Payload Console Output
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCopy}
                disabled={!payload || loading}
              >
                {copied ? <><Check size={14} style={{ color: 'var(--green)' }} /> Copied!</> : <><Copy size={14} /> Copy Payload</>}
              </button>
            </div>

            <div className="terminal-output" style={{ minHeight: 180, maxHeight: 220, position: 'relative', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
              {loading ? (
                <div style={{ color: 'var(--text-dim)', animation: 'pulse 1s infinite' }}>// Re-compiling telemetry payload...</div>
              ) : (
                payload
              )}
            </div>
          </div>

          {/* Instructions Card */}
          <div style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: 'rgba(0, 240, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.08)',
            fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cyan)', fontWeight: 600, marginBottom: 6 }}>
              <Server size={14} /> Local Listener Command
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              Run the following listener on your local machine to catch the inbound reverse shell session:
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '8px 10px',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              color: 'var(--green)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>nc -lvnp {lport || '4444'}</span>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                onClick={() => navigator.clipboard.writeText(`nc -lvnp ${lport || '4444'}`)}
                title="Copy listener command"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 56, 96, 0.05)',
        border: '1px solid rgba(255, 56, 96, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 12
      }}>
        <ShieldAlert size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--red)' }}>ATTENTION:</strong> These payload templates are generated for authorized security audits, penetration testing, and educational purposes only. Never execute shell scripts on target assets without explicit authorization.
        </span>
      </div>
    </div>
  )
}

export default GeneratorView
