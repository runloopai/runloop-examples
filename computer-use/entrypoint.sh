#!/bin/bash
set -e

export DISPLAY=:1
export DISPLAY_NUM=1
export  HEIGHT=1080
export  WIDTH=1920
export STREAMLIT_SERVER_HEADLESS=true

python main.py 
sleep 5
STREAMLIT_SERVER_PORT=8501 python -m streamlit run computer/agent_streamlit.py > /tmp/streamlit_stdout.log &
python http_server.py > /tmp/server_logs.txt 2>&1 &
source .env

echo "✨ Computer Use Demo is ready!"
echo "➡️  Open http://localhost:8080 in your browser to begin"

# Keep the container running
tail -f /dev/nul