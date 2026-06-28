import datetime
import uuid
from typing import List, Dict, Optional
from pydantic import BaseModel

# In-memory storage for IDS alerts
alerts_db: List[Dict] = []

class AlertSimulateRequest(BaseModel):
    attack_type: str  # sql_injection, syn_flood, brute_force, port_scan

# Pre-defined mock alerts for seeding the app
INITIAL_ALERTS = [
    {
        "id": str(uuid.uuid4()),
        "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
        "source_ip": "192.168.1.105",
        "type": "Nmap Port Scan",
        "severity": "medium",
        "description": "TCP Port Scan detected. Source scanned 45 ports in 2.3 seconds.",
        "payload": "SYN scan pattern on ports [21, 22, 23, 80, 443, 8080]"
    },
    {
        "id": str(uuid.uuid4()),
        "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S"),
        "source_ip": "203.0.113.42",
        "type": "SQL Injection Attempt",
        "severity": "critical",
        "description": "SQL Injection payload detected in HTTP POST parameter 'username'.",
        "payload": "POST /api/login HTTP/1.1\nHost: aegis.sentinel\n\nusername=admin' OR '1'='1"
    }
]

# Seed initial alerts
alerts_db.extend(INITIAL_ALERTS)

def get_all_alerts() -> List[Dict]:
    return sorted(alerts_db, key=lambda x: x["timestamp"], reverse=True)

def clear_all_alerts():
    global alerts_db
    alerts_db.clear()

def add_simulated_alert(attack_type: str) -> Dict:
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if attack_type == "sql_injection":
        alert = {
            "id": str(uuid.uuid4()),
            "timestamp": now_str,
            "source_ip": "198.51.100.12",
            "type": "SQL Injection Attempt",
            "severity": "critical",
            "description": "SQL injection signature matches OR statement bypass logic.",
            "payload": "SELECT * FROM users WHERE username = 'admin' UNION SELECT NULL, password, NULL FROM admin_secrets; --"
        }
    elif attack_type == "syn_flood":
        alert = {
            "id": str(uuid.uuid4()),
            "timestamp": now_str,
            "source_ip": "185.190.140.23",
            "type": "SYN Flood Attack",
            "severity": "high",
            "description": "Rapid rate of TCP SYN packets received without completing handshake.",
            "payload": "Rate: 1540 pkts/sec. Incomplete handshakes: 99.4%"
        }
    elif attack_type == "brute_force":
        alert = {
            "id": str(uuid.uuid4()),
            "timestamp": now_str,
            "source_ip": "192.168.1.201",
            "type": "SSH Brute Force",
            "severity": "high",
            "description": "Multiple failed SSH login attempts detected within a short interval.",
            "payload": "Failed login attempts: 45 for user 'root', 'admin', 'user1' on interface eth0"
        }
    elif attack_type == "port_scan":
        alert = {
            "id": str(uuid.uuid4()),
            "timestamp": now_str,
            "source_ip": "10.0.0.52",
            "type": "TCP Connect Scan",
            "severity": "medium",
            "description": "Full TCP connection handshake established sequentially across a range of ports.",
            "payload": "Connect scan mapping ports: 1-1024. Active services logged."
        }
    else:
        alert = {
            "id": str(uuid.uuid4()),
            "timestamp": now_str,
            "source_ip": "127.0.0.1",
            "type": "Generic Security Event",
            "severity": "low",
            "description": "Simulated generic warning triggered by user request.",
            "payload": "N/A"
        }
        
    alerts_db.append(alert)
    return alert
