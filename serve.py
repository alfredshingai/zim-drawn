"""Dev server for zim-drawn: same as http.server but sends no-cache headers
so browsers always fetch the latest HTML/JS/CSS. Run:
  python3 serve.py [port]   (default 8765)
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    srv = ThreadingHTTPServer(("0.0.0.0", port), NoCacheHandler)
    print(f"zim-drawn on http://localhost:{port} (no-cache)", flush=True)
    srv.serve_forever()
