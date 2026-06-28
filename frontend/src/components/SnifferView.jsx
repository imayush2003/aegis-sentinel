import { useState, useEffect, useRef } from 'react'
import { Wifi, Play, Square, Filter, Eye, X } from 'lucide-react'

function SnifferView({ fetchWithAuth }) {
  const [packets, setPackets] = useState([])
  const [status, setStatus] = useState({ is_running: false, mode: 'Unknown', interface: 'N/A', total_captured: 0 })
  const [filter, setFilter] = useState('ALL')
  const [selectedPacket, setSelectedPacket] = useState(null)
  const lastIdRef = useRef(0)
  const tableRef = useRef(null)

  const fetchStatus = async () => {
    try {
      const res = await fetchWithAuth('/api/sniffer/status')
      if (res.ok) setStatus(await res.json())
    } catch (err) {
      console.error('Failed to fetch sniffer status:', err)
    }
  }

  const fetchPackets = async () => {
    try {
      const res = await fetchWithAuth(`/api/sniffer/packets?after_id=${lastIdRef.current}`)
      if (res.ok) {
        const data = await res.json()
        if (data.packets.length > 0) {
          setPackets(prev => {
            const next = [...prev, ...data.packets].slice(-100)
            return next
          })
          lastIdRef.current = data.packets[data.packets.length - 1].id
        }
      }
    } catch (err) {
      console.error('Failed to fetch packets:', err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStatus()
      fetchPackets()
    }, 0)
    const iv = setInterval(() => {
      fetchStatus()
      fetchPackets()
    }, 1500)
    return () => {
      clearTimeout(timer)
      clearInterval(iv)
    }
  }, [])

  // Auto-scroll table
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight
    }
  }, [packets])

  const toggleSniffer = async () => {
    try {
      const endpoint = status.is_running ? '/api/sniffer/stop' : '/api/sniffer/start'
      await fetchWithAuth(endpoint, { method: 'POST' })
      fetchStatus()
    } catch (err) {
      console.error('Failed to toggle sniffer:', err)
    }
  }

  const filters = ['ALL', 'TCP', 'UDP', 'ICMP', 'DNS', 'HTTP']
  const filteredPackets = filter === 'ALL'
    ? packets
    : packets.filter(p => p.protocol.toUpperCase() === filter)

  const getProtocolBadge = (protocol) => {
    const cls = protocol.toLowerCase()
    return <span className={`badge ${cls}`}>{protocol}</span>
  }

  return (
    <div>
      {/* Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              id="sniffer-toggle-btn"
              className={`btn ${status.is_running ? 'btn-danger' : 'btn-primary'}`}
              onClick={toggleSniffer}
            >
              {status.is_running ? <><Square size={14} /> Stop Capture</> : <><Play size={14} /> Start Capture</>}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Mode: <span style={{ color: 'var(--cyan)' }}>{status.mode}</span>
              &nbsp;|&nbsp;
              Interface: <span style={{ color: 'var(--purple)' }}>{status.interface}</span>
              &nbsp;|&nbsp;
              Captured: <span style={{ color: 'var(--green)' }}>{status.total_captured}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
            <Filter size={14} /> Filter:
          </div>
        </div>

        <div className="filter-pills" style={{ marginTop: 12 }}>
          {filters.map(f => (
            <button
              key={f}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Packet Table */}
      <div className="data-table-wrapper" ref={tableRef} style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Protocol</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Length</th>
              <th>Summary</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPackets.map(pkt => (
              <tr key={pkt.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPacket(pkt)}>
                <td style={{ color: 'var(--text-dim)' }}>{pkt.id}</td>
                <td>{pkt.timestamp}</td>
                <td>{getProtocolBadge(pkt.protocol)}</td>
                <td style={{ color: 'var(--cyan)' }}>{pkt.src_ip}{pkt.src_port ? `:${pkt.src_port}` : ''}</td>
                <td style={{ color: 'var(--purple)' }}>{pkt.dst_ip}{pkt.dst_port ? `:${pkt.dst_port}` : ''}</td>
                <td>{pkt.length}B</td>
                <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkt.summary}</td>
                <td><Eye size={14} style={{ color: 'var(--text-dim)', cursor: 'pointer' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPackets.length === 0 && (
          <div className="empty-state">
            <Wifi size={40} style={{ opacity: 0.2 }} />
            <p style={{ marginTop: 12 }}>
              {status.is_running ? 'Waiting for packets...' : 'Start the sniffer to capture packets'}
            </p>
          </div>
        )}
      </div>

      {/* Packet Inspector Modal */}
      {selectedPacket && (
        <div className="modal-overlay" onClick={() => setSelectedPacket(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
            <button className="modal-close-btn" onClick={() => setSelectedPacket(null)}><X size={20} /></button>
            <h3><Eye size={18} /> Packet Inspector #{selectedPacket.id}</h3>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Source</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--cyan)' }}>
                  {selectedPacket.src_ip}{selectedPacket.src_port ? `:${selectedPacket.src_port}` : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Destination</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--purple)' }}>
                  {selectedPacket.dst_ip}{selectedPacket.dst_port ? `:${selectedPacket.dst_port}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {getProtocolBadge(selectedPacket.protocol)}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {selectedPacket.length} bytes | {selectedPacket.timestamp}
              </span>
            </div>

            <div style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>
              {selectedPacket.summary}
            </div>

            {selectedPacket.payload_hex && (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Hex Dump</div>
                <div className="terminal-output" style={{ marginBottom: 12, color: 'var(--green)', maxHeight: 140 }}>
                  {selectedPacket.payload_hex}
                </div>
              </>
            )}

            {selectedPacket.payload_ascii && (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>ASCII</div>
                <div className="terminal-output" style={{ color: 'var(--cyan)', maxHeight: 140 }}>
                  {selectedPacket.payload_ascii}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SnifferView
