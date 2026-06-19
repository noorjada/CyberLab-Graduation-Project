FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl wget netcat-openbsd nmap \
    python3 python3-pip \
    openssh-server \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create a regular user
RUN useradd -m -s /bin/bash hacker && \
    echo "hacker:password123" | chpasswd && \
    adduser hacker sudo

# Plant the flag in a hidden location
RUN mkdir -p /opt/secret && \
    echo "FLAG{linux_enum_master}" > /opt/secret/.flag.txt && \
    chmod 644 /opt/secret/.flag.txt && \
    chown root:root /opt/secret/.flag.txt

# Create some decoy files
RUN echo "This is not the flag" > /home/hacker/notes.txt && \
    echo "Keep looking..." > /tmp/hint.txt && \
    mkdir -p /home/hacker/.hidden && \
    echo "Getting warmer..." > /home/hacker/.hidden/clue.txt

# Create a challenge script
RUN echo '#!/bin/bash\necho "Welcome to CyberLab Linux Challenge!"\necho "Your goal: Find the hidden flag"\necho "Hint: flags are often hidden in /opt or /var directories"' > /home/hacker/readme.sh && \
    chmod +x /home/hacker/readme.sh

WORKDIR /home/hacker
CMD ["/bin/bash"]