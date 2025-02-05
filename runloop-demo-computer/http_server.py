import os
import socket
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
import dotenv
dotenv.load_dotenv()


VNC_URL = os.getenv("VNC_URL")

class CustomHandler(SimpleHTTPRequestHandler):
    """

    This module contains the definition of a custom HTTP request handler.

    Classes:
        CustomHandler: A subclass of SimpleHTTPRequestHandler that handles GET requests.

    CustomHandler:
        Methods:
            do_GET(self):
                Handles GET requests. If the request path is "/env", it responds with a JSON object containing the VNC_URL. Otherwise, it delegates to the superclass's do_GET method.
    """
    def do_GET(self):
        if self.path == "/env":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"VNC_URL": VNC_URL}).encode("utf-8"))
        else:
            super().do_GET()

class HTTPServerV6(HTTPServer):
    address_family = socket.AF_INET6

def run_server():
    """
    Change the current working directory to the 'static_content' directory and start an HTTP server.

    This function sets the current working directory to a subdirectory named 'static_content' relative to the script's location.
    It then initializes an HTTP server that listens on all available IPv6 interfaces on port 8080 and serves requests using the
    `CustomHandler` class.

    Raises:
        OSError: If the server fails to start due to issues such as the port being in use or insufficient permissions.

    Note:
        Ensure that the 'static_content' directory exists in the same directory as this script.
    """
    os.chdir(os.path.dirname(__file__) + "/static_content")
    server_address = ("::", 8080)
    httpd = HTTPServerV6(server_address, CustomHandler)
    print("Starting HTTP server on port 8080...") 
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
