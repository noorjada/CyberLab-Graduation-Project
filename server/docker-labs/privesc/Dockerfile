FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    sudo curl wget python3 \
    && rm -rf /var/lib/apt/lists/*

# Create low privilege user
RUN useradd -m -s /bin/bash student && \
    echo "student:student123" | chpasswd

# Plant flag only root can read
RUN echo "FLAG{r00t_pr1v3sc_master}" > /root/flag.txt && \
    chmod 600 /root/flag.txt

# Create SUID vulnerability on find
RUN chmod u+s /usr/bin/find

# Create hint file
RUN echo "You need root to read /root/flag.txt\nHint: check SUID binaries with: find / -perm -u=s -type f 2>/dev/null" > /home/student/readme.txt

WORKDIR /home/student
USER student
CMD ["/bin/bash"]