import socket
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.environ.get("SUPABASE_URL")
# extract hostname
from urllib.parse import urlparse
hostname = urlparse(url).hostname

print(f"Resolving {hostname}...")
try:
    infos = socket.getaddrinfo(hostname, 443)
    for info in infos:
        family, type, proto, canonname, sockaddr = info
        print(f"Family: {family} (AF_INET={socket.AF_INET}, AF_INET6={socket.AF_INET6})")
        print(f"Sockaddr: {sockaddr}")
except Exception as e:
    print(f"Error: {e}")

print("Attempting socket connect to first address...")
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    ip = infos[0][4][0]
    print(f"Connecting to {ip}:443...")
    s.connect((ip, 443))
    print("Connected successfully!")
    s.close()
except Exception as e:
    print(f"Socket connect error: {e}")
