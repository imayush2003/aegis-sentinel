import { useState } from 'react'
import { Lock, ShieldCheck, Hash, Zap, Eye, EyeOff } from 'lucide-react'

function CrackerView({ fetchWithAuth }) {
  // Password Analyzer state
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  // Hash Cracker state
  const [hashValue, setHashValue] = useState('')
  const [hashType, setHashType] = useState('md5')
  const [wordlistDepth, setWordlistDepth] = useState(1000)
  const [cracking, setCracking] = useState(false)
  const [crackResult, setCrackResult] = useState(null)

  const analyzePassword = async () => {
    if (!password) return
    try {
      const res = await fetchWithAuth('/api/cracker/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) setAnalysis(await res.json())
    } catch {
      // Offline fallback
      const len = password.length
      setAnalysis({
        password,
        length: len,
        entropy: len * 4.5,
        strength: len >= 12 ? 'Strong' : len >= 8 ? 'Medium' : 'Weak',
        color: len >= 12 ? 'var(--green)' : len >= 8 ? 'var(--yellow)' : 'var(--red)',
        is_common: false,
        suggestions: ['Connect backend for full analysis'],
        time_to_crack: 'Unknown'
      })
    }
  }

  const crackHash = async () => {
    if (!hashValue.trim()) return
    setCracking(true)
    setCrackResult(null)
    try {
      const res = await fetchWithAuth('/api/cracker/crack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash_value: hashValue,
          hash_type: hashType,
          wordlist_depth: wordlistDepth
        })
      })
      if (res.ok) setCrackResult(await res.json())
    } catch (err) {
      setCrackResult({ success: false, error: err.message })
    }
    setCracking(false)
  }

  const getStrengthWidth = () => {
    if (!analysis) return '0%'
    const map = { 'Very Weak': '15%', 'Weak': '35%', 'Medium': '60%', 'Strong': '90%' }
    return map[analysis.strength] || '10%'
  }

  return (
    <div>
      <div className="grid-2">
        {/* Password Analyzer */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={16} className="card-icon" />
              Password Strength Analyzer
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 12 }}>
            <label>Enter Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                className="input-field"
                style={{ width: '100%', paddingRight: 40 }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setAnalysis(null) }}
                placeholder="Type a password to analyze..."
                onKeyDown={e => e.key === 'Enter' && analyzePassword()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button id="analyze-password-btn" className="btn btn-primary btn-sm" onClick={analyzePassword} disabled={!password}>
            <Zap size={14} /> Analyze
          </button>

          {analysis && (
            <div style={{ marginTop: 20 }}>
              {/* Strength Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                <span>Strength</span>
                <span style={{ color: analysis.color }}>{analysis.strength}</span>
              </div>
              <div className="strength-bar-container">
                <div
                  className="strength-bar-fill"
                  style={{ width: getStrengthWidth(), background: analysis.color, color: analysis.color }}
                />
              </div>

              {/* Details */}
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Length</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--cyan)' }}>{analysis.length}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entropy</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--purple)' }}>{analysis.entropy} bits</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Time to Crack</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--yellow)' }}>{analysis.time_to_crack}</div>
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Dictionary Match</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: analysis.is_common ? 'var(--red)' : 'var(--green)' }}>
                    {analysis.is_common ? '⚠ FOUND' : '✓ NOT FOUND'}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.8 }}>
                    Security Recommendations
                  </div>
                  {analysis.suggestions.map((s, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: 'var(--text-secondary)', padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <span style={{ color: 'var(--yellow)' }}>→</span> {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hash Cracker */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Hash size={16} className="card-icon" />
              Dictionary Hash Cracker
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 12 }}>
            <label>Hash Value</label>
            <input
              id="hash-input"
              className="input-field"
              value={hashValue}
              onChange={e => setHashValue(e.target.value)}
              placeholder="Paste MD5, SHA-1, or SHA-256 hash..."
            />
          </div>

          <div className="input-row" style={{ marginBottom: 16 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Hash Type</label>
              <select
                id="hash-type-select"
                className="select-field"
                value={hashType}
                onChange={e => setHashType(e.target.value)}
              >
                <option value="md5">MD5</option>
                <option value="sha1">SHA-1</option>
                <option value="sha256">SHA-256</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Wordlist Depth</label>
              <select
                id="wordlist-depth-select"
                className="select-field"
                value={wordlistDepth}
                onChange={e => setWordlistDepth(Number(e.target.value))}
              >
                <option value={100}>100 words (fast)</option>
                <option value={1000}>1,000 words</option>
                <option value={5000}>5,000 words (deep)</option>
              </select>
            </div>
          </div>

          <button
            id="crack-hash-btn"
            className="btn btn-primary"
            onClick={crackHash}
            disabled={cracking || !hashValue.trim()}
          >
            {cracking ? 'Cracking...' : <><Lock size={14} /> Crack Hash</>}
          </button>

          {cracking && (
            <div className="progress-bar" style={{ marginTop: 12 }}>
              <div className="progress-bar-fill" style={{ width: '60%', animation: 'scanGrow 1.5s ease-in-out infinite' }} />
            </div>
          )}

          {crackResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                padding: 16,
                borderRadius: 'var(--radius-sm)',
                background: crackResult.success ? 'rgba(0, 255, 102, 0.06)' : 'rgba(255, 56, 96, 0.06)',
                border: `1px solid ${crackResult.success ? 'rgba(0, 255, 102, 0.2)' : 'rgba(255, 56, 96, 0.2)'}`,
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 32,
                  marginBottom: 8
                }}>
                  {crackResult.success ? '🔓' : '🔒'}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: crackResult.success ? 'var(--green)' : 'var(--red)',
                  marginBottom: 4
                }}>
                  {crackResult.success ? 'HASH CRACKED!' : 'HASH NOT CRACKED'}
                </div>

                {crackResult.success && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 20,
                    color: 'var(--cyan)',
                    padding: '8px 0',
                    fontWeight: 700
                  }}>
                    {crackResult.cracked_password}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Attempts</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--cyan)' }}>
                    {crackResult.attempts?.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Time</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--purple)' }}>
                    {crackResult.elapsed_time}s
                  </div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Wordlist</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--yellow)' }}>
                    {crackResult.wordlist_size?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CrackerView
