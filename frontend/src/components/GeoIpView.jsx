import { useState } from 'react'
import { MapPin, Search, Globe, ShieldAlert, Cpu, Database, Eye } from 'lucide-react'

function GeoIpView({ fetchWithAuth }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const runRecon = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetchWithAuth(`/api/osint/geoip?query=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } catch (err) {
      console.error('GeoIP error:', err)
    }
    setLoading(false)
  }

  // Calculate pixel coordinates for map
  const getMapCoordinates = (lat, lon) => {
    if (lat === undefined || lon === undefined) return { x: 0, y: 0 }
    // Equirectangular mapping to 800x400 SVG viewbox
    const x = ((lon + 180) / 360) * 800
    const y = ((90 - lat) / 180) * 400
    return { x, y }
  }

  const geoip = result?.geoip
  const whois = result?.whois
  const coords = geoip && geoip.status === 'success' ? getMapCoordinates(geoip.lat, geoip.lon) : null

  return (
    <div>
      {/* Search Panel */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">
            <Globe size={16} className="card-icon" />
            Active IP & Geolocation Intelligence
          </div>
        </div>
        <div className="input-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label>Target Host / IP Address</label>
            <input
              id="geoip-query-input"
              className="input-field"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. 8.8.8.8, github.com, or local router IP"
              onKeyDown={e => e.key === 'Enter' && runRecon()}
            />
          </div>
          <button
            id="geoip-run-btn"
            className="btn btn-primary"
            onClick={runRecon}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Resolving...' : <><Search size={14} /> Geolocate & Audit</>}
          </button>
        </div>
      </div>

      {/* Cyber World Map Display */}
      <div className="card" style={{ padding: 12, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>
        <div className="card-title" style={{ padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={14} style={{ color: 'var(--cyan)' }} /> 
          Global Telemetry Radar Mesh
        </div>

        <div style={{ position: 'relative', background: '#070a0f', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.05)' }}>
          {/* Geolocation Scanner Line Overlay */}
          {loading && <div className="map-scanner-line" />}

          <svg viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Grid background lines */}
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="rgba(0, 240, 255, 0.03)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="rgba(0, 240, 255, 0.03)" strokeWidth="0.5" />
            ))}

            {/* Continent outline paths (cyberpunk mesh approximation) */}
            {/* North America */}
            <path d="M80,100 L240,80 L310,130 L270,220 L230,230 L180,160 L80,140 Z" fill="rgba(15, 25, 45, 0.4)" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1.5" />
            {/* South America */}
            <path d="M230,230 L280,230 L300,290 L260,390 L240,370 L210,290 Z" fill="rgba(15, 25, 45, 0.4)" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1.5" />
            {/* Africa */}
            <path d="M380,190 L480,180 L520,210 L540,270 L480,350 L430,360 L400,270 Z" fill="rgba(15, 25, 45, 0.4)" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1.5" />
            {/* Eurasia */}
            <path d="M360,90 L520,60 L700,80 L780,140 L760,230 L660,280 L580,240 L520,240 L460,220 L360,190 Z" fill="rgba(15, 25, 45, 0.4)" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1.5" />
            {/* Australia */}
            <path d="M680,290 L740,290 L760,350 L690,350 Z" fill="rgba(15, 25, 45, 0.4)" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1.5" />

            {/* Target Geolocation Pointer */}
            {coords && (
              <g>
                {/* Sonar Ping Rings */}
                <circle cx={coords.x} cy={coords.y} r="25" fill="none" stroke="var(--cyan)" strokeWidth="1" opacity="0.8">
                  <animate attributeName="r" values="5;45" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={coords.x} cy={coords.y} r="45" fill="none" stroke="var(--purple)" strokeWidth="0.8" opacity="0.6">
                  <animate attributeName="r" values="10;60" dur="2s" begin="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0" dur="2s" begin="0.8s" repeatCount="indefinite" />
                </circle>

                {/* Reticle lines */}
                <line x1={coords.x - 15} y1={coords.y} x2={coords.x + 15} y2={coords.y} stroke="var(--cyan)" strokeWidth="1.5" />
                <line x1={coords.x} y1={coords.y - 15} x2={coords.x} y2={coords.y + 15} stroke="var(--cyan)" strokeWidth="1.5" />
                
                {/* Inner target dot */}
                <circle cx={coords.x} cy={coords.y} r="4" fill="var(--green)" style={{ filter: 'drop-shadow(0 0 5px var(--green))' }} />
              </g>
            )}
          </svg>

          {/* Coordinate telemetry text absolute placement */}
          {geoip && geoip.status === 'success' && (
            <div style={{
              position: 'absolute', bottom: 12, left: 12,
              background: 'rgba(5, 8, 15, 0.8)',
              padding: '6px 10px', borderRadius: 4,
              border: '1px solid rgba(0, 240, 255, 0.2)',
              fontSize: 10, fontFamily: 'var(--font-mono)',
              color: 'var(--cyan)'
            }}>
              GEO TARGET: {geoip.lat?.toFixed(4)}, {geoip.lon?.toFixed(4)} ({geoip.city}, {geoip.countryCode})
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="grid-2">
          {/* Telemetry readouts */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Database size={16} className="card-icon" />
                ISP & Geolocation Telemetry
              </div>
            </div>

            {geoip && geoip.status === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Resolved IP', val: geoip.query, color: 'var(--green)' },
                  { label: 'ISP / Provider', val: geoip.isp },
                  { label: 'ASN Gateway', val: geoip.as },
                  { label: 'Country / Code', val: `${geoip.country} (${geoip.countryCode})` },
                  { label: 'Region / State', val: `${geoip.regionName} (${geoip.region})` },
                  { label: 'City Name', val: geoip.city },
                  { label: 'Timezone ID', val: geoip.timezone }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{item.label}</span>
                    <span style={{
                      fontSize: 12, fontFamily: 'var(--font-mono)',
                      color: item.color || 'var(--text-primary)',
                      textAlign: 'right', fontWeight: 600
                    }}>{item.val || 'N/A'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 12 }}>
                <ShieldAlert size={28} style={{ color: 'var(--red)', marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {geoip?.message || 'Resolution failed for target IP address.'}
                </p>
              </div>
            )}
          </div>

          {/* WHOIS Information */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Eye size={16} className="card-icon" />
                WHOIS & DNS Security Audit
              </div>
            </div>

            {whois ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Registrar', val: whois.registrar || whois.registry || 'N/A' },
                  { label: 'Created Date', val: whois.creation_date || whois.created || 'N/A' },
                  { label: 'Expiration Date', val: whois.expiration_date || 'N/A' },
                  { label: 'Abuse Email', val: whois.registrar_abuse_email || whois.abuse_contact || 'N/A' },
                  { label: 'DNSSEC Status', val: whois.dnssec, color: whois.dnssec === 'unsigned' ? 'var(--yellow)' : 'var(--green)' }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{item.label}</span>
                    <span style={{
                      fontSize: 12, fontFamily: 'var(--font-mono)',
                      color: item.color || 'var(--text-primary)',
                      textAlign: 'right', fontWeight: 600
                    }}>{item.val || 'N/A'}</span>
                  </div>
                ))}

                {/* Audit Signals */}
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{
                    padding: '8px 10px', borderRadius: 6,
                    background: whois.spf_status?.includes('PASS') ? 'rgba(0, 255, 102, 0.05)' : 'rgba(255, 221, 87, 0.05)',
                    border: `1px solid ${whois.spf_status?.includes('PASS') ? 'rgba(0, 255, 102, 0.1)' : 'rgba(255, 221, 87, 0.1)'}`
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>SPF Record</div>
                    <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: whois.spf_status?.includes('PASS') ? 'var(--green)' : 'var(--yellow)' }}>
                      {whois.spf_status?.split(' ')[0]}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '8px 10px', borderRadius: 6,
                    background: whois.mx_status?.includes('ACTIVE') ? 'rgba(0, 255, 102, 0.05)' : 'rgba(255, 56, 96, 0.05)',
                    border: `1px solid ${whois.mx_status?.includes('ACTIVE') ? 'rgba(0, 255, 102, 0.1)' : 'rgba(255, 56, 96, 0.1)'}`
                  }}>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mail Exchange (MX)</div>
                    <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: whois.mx_status?.includes('ACTIVE') ? 'var(--green)' : 'var(--red)' }}>
                      {whois.mx_status?.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 12 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No WHOIS record query retrieved.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Default/Empty State */}
      {!result && !loading && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'rgba(5, 8, 15, 0.2)' }}>
          <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.15, color: 'var(--cyan)' }} />
          <h4 style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No Active Target</h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            Input a public domain or IP address in the configuration controller above to query geographical and registrar intelligence logs.
          </p>
        </div>
      )}
    </div>
  )
}

export default GeoIpView
