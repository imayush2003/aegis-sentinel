import { useState } from 'react'
import { Radar, Play, CheckCircle, Server } from 'lucide-react'

function ScannerView({ fetchWithAuth }) {
  const [target, setTarget] = useState('127.0.0.1')
  const [startPort, setStartPort] = useState('1')
  const [endPort, setEndPort] = useState('1024')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [terminalLog, setTerminalLog] = useState([])

  const log = (msg, type = 'info') => {
    setTerminalLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }])
  }

  const runScan = async () => {
    setScanning(true)
    setResults(null)
    setTerminalLog([])
    setProgress(0)

    log(`[*] Initiating TCP scan on ${target}:${startPort}-${endPort}`, 'info')
    log(`[*] Threads: 25 | Timeout: 1.0s`, 'info')

    // Simulate progress animation
    const progressIv = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 400)

    try {
      const res = await fetchWithAuth('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          start_port: parseInt(startPort),
          end_port: parseInt(endPort)
        })
      })

      clearInterval(progressIv)
      setProgress(100)

      if (res.ok) {
        const data = await res.json()
        setResults(data)
        log(`[+] Scan complete. ${data.total_open} open port(s) discovered.`, 'success')
        data.open_ports.forEach(p => {
          log(`[+] PORT ${p.port}/tcp  OPEN  ${p.service}  ${p.banner}`, 'success')
        })
        if (data.total_open === 0) {
          log(`[-] No open ports found in range ${startPort}-${endPort}`, 'error')
        }
      } else {
        log('[!] Scan failed: Server returned an error', 'error')
      }
    } catch (err) {
      clearInterval(progressIv)
      setProgress(100)
      log(`[!] Scan failed: ${err.message}`, 'error')
    }

    setScanning(false)
  }

  return (
    <div>
      {/* Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">
            <Radar size={16} className="card-icon" />
            Port Scan Configuration
          </div>
        </div>
        <div className="input-row">
          <div className="input-group" style={{ flex: 2 }}>
            <label>Target Host / IP</label>
            <input
              id="scanner-target-input"
              className="input-field"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="e.g. 127.0.0.1 or sentinel.local"
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Start Port</label>
            <input
              id="scanner-start-port"
              className="input-field"
              type="number"
              value={startPort}
              onChange={e => setStartPort(e.target.value)}
              min="1"
              max="65535"
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>End Port</label>
            <input
              id="scanner-end-port"
              className="input-field"
              type="number"
              value={endPort}
              onChange={e => setEndPort(e.target.value)}
              min="1"
              max="65535"
            />
          </div>
          <button
            id="scanner-run-btn"
            className="btn btn-primary"
            onClick={runScan}
            disabled={scanning || !target}
          >
            {scanning ? 'Scanning...' : <><Play size={14} /> Launch Scan</>}
          </button>
        </div>

        {/* Progress */}
        {scanning && (
          <div className="progress-bar" style={{ marginTop: 16 }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Terminal */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={16} className="card-icon" />
              Scan Console
            </div>
          </div>
          <div className="terminal-output">
            <span className="line-prompt">aegis@sentinel:~$ </span>nmap-lite --scan {target} -p {startPort}-{endPort}{'\n'}
            {terminalLog.map((l, i) => (
              <span key={i} className={l.type === 'error' ? 'line-error' : l.type === 'success' ? '' : 'line-info'}>
                {l.msg}{'\n'}
              </span>
            ))}
            {scanning && <span style={{ animation: 'blink 1s infinite' }}>▋</span>}
          </div>
        </div>

        {/* Results Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle size={16} className="card-icon" />
              Discovered Services
            </div>
            {results && <span className="badge open">{results.total_open} OPEN</span>}
          </div>

          {results && results.open_ports.length > 0 ? (
            <div className="data-table-wrapper" style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Port</th>
                    <th>Status</th>
                    <th>Service</th>
                    <th>Banner</th>
                  </tr>
                </thead>
                <tbody>
                  {results.open_ports.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--cyan)', fontWeight: 600 }}>{p.port}</td>
                      <td><span className="badge open">open</span></td>
                      <td style={{ color: 'var(--text-primary)' }}>{p.service}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.banner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Radar size={40} style={{ opacity: 0.2 }} />
              <p style={{ marginTop: 12 }}>Run a scan to discover open ports</p>
            </div>
          )}

          {/* Vulnerability notes */}
          {results && results.open_ports.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 8 }}>
                Vulnerability Notes
              </div>
              {results.open_ports.map((p, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  marginBottom: 6,
                  borderRadius: 6,
                  background: 'rgba(255, 56, 96, 0.05)',
                  border: '1px solid rgba(255, 56, 96, 0.1)',
                  fontSize: 12
                }}>
                  <span style={{ color: 'var(--yellow)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    Port {p.port} ({p.service}):
                  </span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{p.vulnerability}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScannerView
