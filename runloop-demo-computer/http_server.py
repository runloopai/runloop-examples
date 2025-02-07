import http.server
import socketserver
import multiprocessing

PORT = 8080


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, vnc_url=None, **kwargs):
        self.vnc_url = vnc_url
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == "/":
            try:
                with open("static_content/index.html", "r") as f:
                    html_content = f.read().replace("{{VNC_URL}}", self.vnc_url)

                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(html_content.encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Error loading page: {e}".encode("utf-8"))

        else:
            super().do_GET()


class CustomHTTPServer(socketserver.TCPServer):
    allow_reuse_address = True  # Allows reusing the same port after shutdown


def run_server(vnc_url):
    handler = lambda *args, **kwargs: CustomHandler(*args, vnc_url=vnc_url, **kwargs)

    # Bind to IPv4 and IPv6 to ensure accessibility
    with CustomHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        httpd.serve_forever()


def start_server(vnc_url):
    """Starts the HTTP server in a background process and returns the process."""
    server_process = multiprocessing.Process(
        target=run_server, args=(vnc_url,), daemon=True
    )
    server_process.start()
    return server_process
