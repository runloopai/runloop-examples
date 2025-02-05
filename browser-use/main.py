from runloop_api_client import Runloop
import os
from utils import update_env_file
from dotenv import load_dotenv
load_dotenv()

def initialize_devbox():
    """
    This function creates a new Devbox with a managed browser using the Runloop API. 
    It waits for the Devbox to be fully running and then retrieves the connection 
    details required for Playwright to interact with the browser.
        
    Returns:
        dict: A dictionary containing the following keys:
            - DEVBOX (str): The ID of the created Devbox.
            - CDP_URL (str): The WebSocket Debugger URL for Playwright.
            - VNC_URL (str): The URL for the live view of the browser.
    """

    client = Runloop(bearer_token=os.getenv("RUNLOOP_PRO"), base_url="https://api.runloop.pro")

    browser = client.devboxes.browsers.create()
    response = client.devboxes.await_running(browser.devbox.id)
    print(browser)
    playwright_cdp_ws = browser.connection_url
    vnc_url = browser.live_view_url

    return {
        "DEVBOX": browser.devbox.id,
        "CDP_URL": playwright_cdp_ws,
        "VNC_URL": vnc_url,
    }

if __name__ == "__main__":
    connection_info = initialize_devbox()

    update_env_file(connection_info)
    print("Updated .env file successfully!")

