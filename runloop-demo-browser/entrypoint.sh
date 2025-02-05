#!/bin/bash
set -ex  

export DISPLAY=:1
export DISPLAY_NUM=1
export  HEIGHT=1280
export  WIDTH=720

python main.py 
sleep 5
source .env

STREAMLIT_SERVER_PORT=8501 

python -m streamlit run model/agent_streamlit.py --server.headless true > /tmp/streamlit_stdout.log &
python http_server.py > /tmp/server_logs.txt 2>&1 &

echo "✨ Browser Use Demo is ready!"
echo "➡️  Open http://localhost:8080 in your browser to begin"


