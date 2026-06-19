FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    tcpdump wireshark-common tshark \
    python3 curl wget netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Create a fake pcap file with credentials
RUN mkdir -p /home/analyst/captures

# Create a Python script to generate capture evidence
RUN echo 'import os\nos.makedirs("/home/analyst/captures", exist_ok=True)\nwith open("/home/analyst/captures/traffic.txt", "w") as f:\n    f.write("HTTP Traffic Analysis\\n")\n    f.write("="*50 + "\\n")\n    f.write("POST /login HTTP/1.1\\n")\n    f.write("Host: targetserver.com\\n")\n    f.write("Content-Type: application/x-www-form-urlencoded\\n\\n")\n    f.write("username=admin&password=secretpass123\\n\\n")\n    f.write("HTTP/1.1 200 OK\\n")\n    f.write("Set-Cookie: session=abc123\\n\\n")\n    f.write("Welcome admin!\\n")\n    f.write("\\nFLAG{wireshark_network_ninja}\\n")' > /tmp/gen.py && \
    python3 /tmp/gen.py

# Plant flag
RUN echo "FLAG{wireshark_network_ninja}" > /root/flag.txt && \
    chmod 600 /root/flag.txt

# Create hints
RUN echo "Network traffic has been captured.\nAnalyze the files in /home/analyst/captures/\nLook for HTTP POST requests with credentials" > /home/analyst/readme.txt

WORKDIR /home/analyst
CMD ["/bin/bash"]