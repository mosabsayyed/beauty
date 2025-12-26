import socket
import os
import ssl
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.environ.get("SUPABASE_URL")
from urllib.parse import urlparse
hostname = urlparse(url).hostname

print(f"Resolving {hostname}...")
infos = socket.getaddrinfo(hostname, 443)
ip = infos[0][4][0]
print(f"Connecting to {ip}:443...")

try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(10)
    s.connect((ip, 443))
    print("TCP Connected!")

    print("Wrapping socket with SSL...")
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE  # Match verify=False behavior
    
    ss = context.wrap_socket(s, server_hostname=hostname)
    print("SSL Handshake completed!")
    print(f"Cipher: {ss.cipher()}")
    ss.close()
except Exception as e:
    print(f"Error: {e}")
