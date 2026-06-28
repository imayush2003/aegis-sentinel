from fastapi import FastAPI, Query, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Optional
import sys
import os
import secrets

from app.sniffer import start_sniffer, stop_sniffer, get_packets, get_status as get_sniffer_status
from app.scanner import execute_port_scan, PortScanRequest
from app.osint import query_dns_records, scan_subdomains
from app.cracker import analyze_password, crack_hash, PasswordCheckRequest, HashCrackRequest
from app.ids import get_all_alerts, add_simulated_alert, clear_all_alerts, AlertSimulateRequest
from app.generator import build_payload, PayloadRequest
from app.geoip import fetch_geoip_data, fetch_whois_data

app = FastAPI(
    title="Aegis Sentinel API",
    description="Advanced Cybersecurity & Network Security API Suite",
    version="1.0.0"
)

# --- Authentication ---
security = HTTPBasic()

# Load credentials from environment variables (set these before deploying)
AEGIS_USERNAME = os.environ.get("AEGIS_USERNAME", "admin")
AEGIS_PASSWORD = os.environ.get("AEGIS_PASSWORD", "aegis2024")

def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify HTTP Basic Auth credentials using constant-time comparison."""
    correct_username = secrets.compare_digest(credentials.username, AEGIS_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, AEGIS_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Public auth verification endpoint for the frontend login flow
@app.get("/api/auth/verify")
def auth_verify(username: str = Depends(verify_credentials)):
    return {"authenticated": True, "username": username}

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow requests from any origin for simplicity in local setups
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Proactively start the packet sniffer on startup so packet visualizer works instantly
    try:
        start_sniffer()
    except Exception:
        pass

@app.on_event("shutdown")
def shutdown_event():
    try:
        stop_sniffer()
    except Exception:
        pass

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "python_version": sys.version,
        "platform": sys.platform,
        "api_version": "1.0.0"
    }

# --- Sniffer Endpoints ---
@app.get("/api/sniffer/status")
def sniffer_status_endpoint(_: str = Depends(verify_credentials)):
    return get_sniffer_status()

@app.post("/api/sniffer/start")
def sniffer_start_endpoint(_: str = Depends(verify_credentials)):
    msg = start_sniffer()
    return {"message": msg, "status": get_sniffer_status()}

@app.post("/api/sniffer/stop")
def sniffer_stop_endpoint(_: str = Depends(verify_credentials)):
    msg = stop_sniffer()
    return {"message": msg, "status": get_sniffer_status()}

@app.get("/api/sniffer/packets")
def sniffer_packets_endpoint(after_id: int = Query(0, description="Get packets captured after this ID"), _: str = Depends(verify_credentials)):
    packets = get_packets(after_id)
    return {"packets": packets, "count": len(packets)}


# --- Port Scanner Endpoints ---
@app.post("/api/scanner/scan")
def port_scan_endpoint(req: PortScanRequest, _: str = Depends(verify_credentials)):
    if not req.target:
        raise HTTPException(status_code=400, detail="Target host or IP address is required")
    if req.start_port < 1 or req.end_port > 65535 or req.start_port > req.end_port:
        raise HTTPException(status_code=400, detail="Invalid port range (1-65535)")
        
    try:
        results = execute_port_scan(req.target, req.start_port, req.end_port)
        return {
            "target": req.target,
            "port_range": f"{req.start_port}-{req.end_port}",
            "open_ports": results,
            "total_open": len([p for p in results if p.get("status") == "open"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan error: {str(e)}")


# --- OSINT Endpoints ---
@app.get("/api/osint/dns")
def osint_dns_endpoint(domain: str = Query(..., description="Target domain for DNS inspection"), _: str = Depends(verify_credentials)):
    if not domain:
        raise HTTPException(status_code=400, detail="Domain query parameter is required")
    records = query_dns_records(domain)
    return {
        "domain": domain,
        "records": records
    }

@app.get("/api/osint/subdomains")
def osint_subdomains_endpoint(domain: str = Query(..., description="Target domain for subdomain mapping"), _: str = Depends(verify_credentials)):
    if not domain:
        raise HTTPException(status_code=400, detail="Domain query parameter is required")
    subdomains = scan_subdomains(domain)
    return {
        "domain": domain,
        "subdomains": subdomains,
        "total_found": len(subdomains)
    }

# --- GeoIP & WHOIS Endpoints ---
@app.get("/api/osint/geoip")
def osint_geoip_endpoint(query: str = Query(..., description="IP or domain to geolocate"), _: str = Depends(verify_credentials)):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    geoip_data = fetch_geoip_data(query)
    whois_data = fetch_whois_data(query)
    return {
        "success": True,
        "geoip": geoip_data,
        "whois": whois_data
    }

# --- Payload Generator Endpoints ---
@app.post("/api/generator/generate")
def generate_payload_endpoint(req: PayloadRequest, _: str = Depends(verify_credentials)):
    try:
        payload = build_payload(req.lhost, req.lport, req.shell_type, req.encoding)
        return {
            "success": True,
            "payload": payload,
            "shell_type": req.shell_type,
            "encoding": req.encoding
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")


# --- Hash Cracker & Password Strength Endpoints ---
@app.post("/api/cracker/analyze")
def cracker_analyze_endpoint(req: PasswordCheckRequest, _: str = Depends(verify_credentials)):
    return analyze_password(req.password)

@app.post("/api/cracker/crack")
def cracker_crack_endpoint(req: HashCrackRequest, _: str = Depends(verify_credentials)):
    if not req.hash_value:
        raise HTTPException(status_code=400, detail="Hash value is required")
    if req.hash_type not in ["md5", "sha1", "sha256"]:
        raise HTTPException(status_code=400, detail="Unsupported hash type. Choose md5, sha1, or sha256.")
    if req.wordlist_depth not in [100, 1000, 5000]:
        raise HTTPException(status_code=400, detail="Wordlist depth must be 100, 1000, or 5000.")
        
    return crack_hash(req.hash_value, req.hash_type, req.wordlist_depth)


# --- IDS Alerts Endpoints ---
@app.get("/api/ids/alerts")
def ids_alerts_endpoint(_: str = Depends(verify_credentials)):
    return {
        "alerts": get_all_alerts(),
        "total": len(get_all_alerts())
    }

@app.post("/api/ids/simulate")
def ids_simulate_endpoint(req: AlertSimulateRequest, _: str = Depends(verify_credentials)):
    new_alert = add_simulated_alert(req.attack_type)
    return {"message": "Attack simulated successfully", "alert": new_alert}

@app.post("/api/ids/clear")
def ids_clear_endpoint(_: str = Depends(verify_credentials)):
    clear_all_alerts()
    return {"message": "Alert console logs cleared."}

# Serve frontend build in production if the dist folder exists
dist_paths = [
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"),
    os.path.join(os.path.dirname(__file__), "..", "static"),
    os.path.join(os.getcwd(), "static"),
    os.path.join(os.getcwd(), "frontend", "dist"),
]
frontend_dist_path = None
for p in dist_paths:
    if os.path.exists(p) and os.path.isdir(p):
        frontend_dist_path = p
        break

if frontend_dist_path:
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="static")
