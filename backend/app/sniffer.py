import threading
import time
import random
import datetime
from typing import List, Dict, Tuple, Optional
import socket

# Try importing scapy for live sniffing
SCAPY_AVAILABLE = False
try:
    import scapy.all as scapy
    SCAPY_AVAILABLE = True
except ImportError:
    pass

# Sniffer state variables
sniffer_thread: Optional[threading.Thread] = None
is_running = False
sniffer_mode = "Simulation" # "Live" or "Simulation"
packets_lock = threading.Lock()
captured_packets: List[Dict] = []
packet_counter = 0
active_interface = "Mock Interface"

# Sample data for simulation mode
MOCK_IPS = [
    "192.168.1.100", "192.168.1.105", "192.168.1.1", "192.168.1.200", # local
    "8.8.8.8", "1.1.1.1", "142.250.190.46", "104.244.42.1", "203.0.113.80" # public
]

MOCK_DOMAINS = ["google.com", "github.com", "sentinel.local", "api.github.com", "cloudflare.com"]

HTTP_PAYLOADS = [
    ("GET /api/v1/status HTTP/1.1\r\nHost: sentinel.local\r\nUser-Agent: Mozilla/5.0\r\n\r\n", "Status check query"),
    ("POST /api/login HTTP/1.1\r\nHost: sentinel.local\r\nContent-Length: 27\r\n\r\nusername=admin&password=123", "User login credentials"),
    ("GET /index.html HTTP/1.1\r\nHost: www.google.com\r\nAccept: text/html\r\n\r\n", "Standard web access request"),
    ("HTTP/1.1 200 OK\r\nServer: nginx/1.18.0\r\nContent-Type: application/json\r\n\r\n{\"status\":\"active\"}", "Server success response")
]

def to_hex_and_ascii(payload_str: str) -> Tuple[str, str]:
    # Formats text into standard hex dump and ASCII format
    payload_bytes = payload_str.encode('utf-8', errors='ignore')
    hex_dump = " ".join(f"{b:02x}" for b in payload_bytes)
    ascii_dump = "".join(chr(b) if 32 <= b <= 126 else "." for b in payload_bytes)
    return hex_dump, ascii_dump

def process_scapy_packet(packet):
    global packet_counter, captured_packets
    if not is_running:
        return
        
    try:
        if not packet.haslayer('IP'):
            return
            
        ip_layer = packet.getlayer('IP')
        src_ip = ip_layer.src
        dst_ip = ip_layer.dst
        length = len(packet)
        protocol = "IP"
        summary = packet.summary()
        src_port = None
        dst_port = None
        payload_hex = ""
        payload_ascii = ""
        
        if packet.haslayer('TCP'):
            protocol = "TCP"
            tcp_layer = packet.getlayer('TCP')
            src_port = tcp_layer.sport
            dst_port = tcp_layer.dport
            if packet.haslayer('Raw'):
                raw_data = bytes(packet.getlayer('Raw').load)
                payload_hex = " ".join(f"{b:02x}" for b in raw_data)
                payload_ascii = "".join(chr(b) if 32 <= b <= 126 else "." for b in raw_data)
        elif packet.haslayer('UDP'):
            protocol = "UDP"
            udp_layer = packet.getlayer('UDP')
            src_port = udp_layer.sport
            dst_port = udp_layer.dport
            if packet.haslayer('DNS'):
                protocol = "DNS"
            if packet.haslayer('Raw'):
                raw_data = bytes(packet.getlayer('Raw').load)
                payload_hex = " ".join(f"{b:02x}" for b in raw_data)
                payload_ascii = "".join(chr(b) if 32 <= b <= 126 else "." for b in raw_data)
        elif packet.haslayer('ICMP'):
            protocol = "ICMP"
            
        with packets_lock:
            packet_counter += 1
            pkt_dict = {
                "id": packet_counter,
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3],
                "protocol": protocol,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "length": length,
                "summary": summary,
                "payload_hex": payload_hex[:500], # truncate long hex
                "payload_ascii": payload_ascii[:250] # truncate long text
            }
            captured_packets.append(pkt_dict)
            if len(captured_packets) > 100:
                captured_packets.pop(0)
    except Exception:
        pass

def live_sniff_worker():
    global is_running
    try:
        # Sniff packets and feed to process_scapy_packet
        scapy.sniff(prn=process_scapy_packet, store=False, stop_filter=lambda p: not is_running)
    except Exception as e:
        # Fall back to simulation mode if permissions fail
        global sniffer_mode, active_interface
        sniffer_mode = "Simulation"
        active_interface = "Mock Interface (Fallback)"
        simulation_worker()

def generate_mock_packet() -> Dict:
    global packet_counter
    packet_counter += 1
    
    protocols = ["TCP", "UDP", "ICMP", "DNS", "HTTP", "HTTPS"]
    protocol = random.choices(protocols, weights=[30, 20, 10, 15, 15, 10])[0]
    
    src_ip = random.choice(MOCK_IPS)
    dst_ip = random.choice([ip for ip in MOCK_IPS if ip != src_ip])
    
    length = random.randint(40, 1200)
    src_port = None
    dst_port = None
    payload_hex = ""
    payload_ascii = ""
    summary = f"Generic {protocol} Packet"
    
    if protocol in ["TCP", "HTTP", "HTTPS"]:
        src_port = random.choice([80, 443, 8080, 22, 49152, 50212])
        dst_port = random.choice([80, 443, 8080, 22, 49152, 50212])
        while dst_port == src_port:
            dst_port = random.choice([80, 443, 8080, 22, 49152, 50212])
            
        if protocol == "HTTP":
            src_port = random.choice([49152, 50212])
            dst_port = random.choice([80, 8080])
            payload_str, label = random.choice(HTTP_PAYLOADS)
            payload_hex, payload_ascii = to_hex_and_ascii(payload_str)
            summary = f"HTTP {label}"
        elif protocol == "HTTPS":
            src_port = random.choice([49152, 50212])
            dst_port = 443
            payload_hex, payload_ascii = to_hex_and_ascii("\x16\x03\x01\x02\x00\x01\x00\x01\xfcClientHello...")
            summary = "TLSv1.3 Handshake - Client Hello"
        else:
            payload_hex, payload_ascii = to_hex_and_ascii(f"Raw TCP Connection segment. Seq={random.randint(1000, 9999)} Ack={random.randint(1000, 9999)}")
            summary = f"TCP Seg: {src_port} -> {dst_port} [SYN]"
            
    elif protocol == "UDP":
        src_port = random.randint(1024, 65535)
        dst_port = random.randint(1024, 65535)
        payload_hex, payload_ascii = to_hex_and_ascii("Raw UDP payload payload bytes...")
        summary = f"UDP: {src_port} -> {dst_port} len={length}"
        
    elif protocol == "DNS":
        src_port = random.randint(40000, 65000)
        dst_port = 53
        domain = random.choice(MOCK_DOMAINS)
        payload_str = f"DNS Standard query 0x{random.randint(1000, 9999):x} A {domain}"
        payload_hex, payload_ascii = to_hex_and_ascii(payload_str)
        summary = payload_str
        
    elif protocol == "ICMP":
        payload_hex, payload_ascii = to_hex_and_ascii("abcdefghijklmnopqrstuvwabcdefghi")
        summary = f"ICMP Echo (ping) request id=0x{random.randint(100, 999):x} seq={random.randint(1, 10)}"
        
    return {
        "id": packet_counter,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3],
        "protocol": protocol,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": src_port,
        "dst_port": dst_port,
        "length": length,
        "summary": summary,
        "payload_hex": payload_hex,
        "payload_ascii": payload_ascii
    }

def simulation_worker():
    global is_running, captured_packets
    while is_running:
        pkt = generate_mock_packet()
        with packets_lock:
            captured_packets.append(pkt)
            if len(captured_packets) > 100:
                captured_packets.pop(0)
        # Sleep for dynamic rate simulation
        time.sleep(random.uniform(0.3, 1.2))

def start_sniffer() -> str:
    global sniffer_thread, is_running, sniffer_mode, active_interface
    if is_running:
        return f"Sniffer is already running in {sniffer_mode} mode."
        
    is_running = True
    
    if SCAPY_AVAILABLE:
        try:
            # Test if Scapy is able to listen (requires admin & WinPcap driver on Windows)
            # This is a safe check of layer 2 connection
            scapy.conf.route.route()
            sniffer_mode = "Live"
            active_interface = scapy.conf.iface.name if hasattr(scapy.conf.iface, "name") else str(scapy.conf.iface)
            sniffer_thread = threading.Thread(target=live_sniff_worker, daemon=True)
        except Exception:
            # Permission or Npcap missing error
            sniffer_mode = "Simulation"
            active_interface = "Mock Interface (Local Fallback)"
            sniffer_thread = threading.Thread(target=simulation_worker, daemon=True)
    else:
        sniffer_mode = "Simulation"
        active_interface = "Mock Interface (No Scapy)"
        sniffer_thread = threading.Thread(target=simulation_worker, daemon=True)
        
    sniffer_thread.start()
    return f"Started sniffing on {active_interface} ({sniffer_mode} Mode)"

def stop_sniffer() -> str:
    global is_running, sniffer_thread
    if not is_running:
        return "Sniffer is not running."
        
    is_running = False
    if sniffer_thread:
        sniffer_thread.join(timeout=1.0)
        sniffer_thread = None
        
    return "Sniffer stopped."

def get_packets(after_id: int = 0) -> List[Dict]:
    with packets_lock:
        return [p for p in captured_packets if p["id"] > after_id]

def get_status() -> Dict:
    with packets_lock:
        return {
            "is_running": is_running,
            "mode": sniffer_mode,
            "interface": active_interface,
            "total_captured": packet_counter
        }
