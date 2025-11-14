#!/usr/bin/env python3
"""
Simple HTTP server with better directory index handling
"""
import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for ES6 modules
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Handle directory requests by serving index.html
        if self.path.endswith('/'):
            self.path += 'index.html'
        return super().do_GET()

os.chdir('/Users/mattvicentin/Desktop/soka-ai-pathways-gamified-main')

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"✨ Server running at http://localhost:{PORT}/")
    print(f"🎮 Game available at: http://localhost:{PORT}/game/")
    print(f"📄 Main site at: http://localhost:{PORT}/")
    print("\nPress Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")

