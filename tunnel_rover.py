#!/usr/bin/env python3
"""
Autonomous Structural Rover - Live Real-Time Tunneling Helper (ngrok)
Exposes the local FastAPI backend & React Dashboard (port 8000) to the public internet,
allowing physical ESP32-CAM rovers and remote clients to stream live telemetry and camera frames.
"""

import sys
import os
import time

def start_tunnel(port=8000):
    try:
        from pyngrok import ngrok, conf
    except ImportError:
        print("[ERROR] pyngrok is not installed. Run: python -m pip install pyngrok")
        sys.exit(1)

    authtoken = os.environ.get("NGROK_AUTHTOKEN")
    if authtoken:
        ngrok.set_auth_token(authtoken)

    print("\n" + "=" * 70)
    print("      INITIALIZING AUTONOMOUS ROVER REAL-TIME LIVE TUNNEL")
    print("=" * 70)
    print(f"[*] Targeting Local Server Port: {port}")

    try:
        # Start tunnel
        http_tunnel = ngrok.connect(port, "http")
        public_url = http_tunnel.public_url

        # Ensure https
        if public_url.startswith("http://"):
            public_url = public_url.replace("http://", "https://", 1)

        print("\n" + "=" * 70)
        print("          >>> LIVE REAL-TIME TUNNEL IS NOW ACTIVE! <<<")
        print("=" * 70)
        print(f"\n[+] Public Tunnel URL:      {public_url}")
        print(f"[+] Live Dashboard:         {public_url}/")
        print(f"[+] Live API Swagger Docs:  {public_url}/docs")
        print("\n" + "-" * 70)
        print("  HOW TO CONNECT YOUR PHYSICAL ESP32-CAM ROVER:")
        print("-" * 70)
        print(f'  1. Open: firmware/esp32_cam_rover/esp32_cam_rover.ino')
        print(f'  2. Set:  const char* BACKEND_HOST = "{public_url}";')
        print('  3. Flash to ESP32-CAM. The rover will now push real-time frames')
        print('     and telemetry over Wi-Fi directly to your system from anywhere!')
        print("-" * 70)
        print("\n[*] Tunnel running... Press Ctrl+C to close.\n")

        # Keep alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[*] Closing ngrok tunnel...")
        ngrok.disconnect(public_url)
        print("[*] Tunnel closed successfully.")
    except Exception as e:
        err = str(e)
        print(f"\n[ERROR] Failed to establish tunnel: {err}")
        if "authtoken" in err.lower():
            print("\n[!] Ngrok requires a free account authtoken:")
            print("    1. Sign up for free at: https://dashboard.ngrok.com/signup")
            print("    2. Copy your Authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken")
            print("    3. Run in terminal: python -c \"from pyngrok import ngrok; ngrok.set_auth_token('YOUR_TOKEN')\"")
            print("    4. Then re-run this script!\n")
        sys.exit(1)

if __name__ == "__main__":
    port_to_tunnel = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    start_tunnel(port_to_tunnel)
