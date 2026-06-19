FROM ubuntu:22.04

RUN apt-get update && apt-get install -y john python3 && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash analyst

RUN mkdir -p /home/analyst/challenge && \
    echo "482c811da5d5b4bc6d497ffa98491e38" > /home/analyst/challenge/admin.hash && \
    echo "5f4dcc3b5aa765d61d8327deb882cf99" > /home/analyst/challenge/backup.hash && \
    chown -R analyst:analyst /home/analyst/challenge

RUN printf '#!/bin/bash\nif [ "$1" = "password123" ]; then\n  echo "FLAG{h4sh_cr4ck3r_pr0}"\nelse\n  echo "Wrong password. Keep cracking!"\nfi\n' \
    > /usr/local/bin/vault_unlock && chmod +x /usr/local/bin/vault_unlock

RUN printf '#!/usr/bin/env python3\nimport hashlib, sys\ntarget = open("/home/analyst/challenge/admin.hash").read().strip()\nwordlist = [line.strip() for line in sys.stdin]\nfor w in wordlist:\n    if hashlib.md5(w.encode()).hexdigest() == target:\n        print(f"[+] Found: {w}")\n        break\nelse:\n    print("[-] Not found in wordlist")\n' \
    > /usr/local/bin/md5crack && chmod +x /usr/local/bin/md5crack

RUN printf 'Hash Cracking Challenge\n=======================\nYou have recovered two MD5 hashes from a compromised server:\n\n  admin:  482c811da5d5b4bc6d497ffa98491e38  (file: challenge/admin.hash)\n  backup: 5f4dcc3b5aa765d61d8327deb882cf99  (file: challenge/backup.hash)\n\nCrack the admin hash to unlock the vault:\n  vault_unlock <password>\n\nTools available:\n  1. Python script (manual brute force):\n     python3 -c "import hashlib; print(hashlib.md5(b'\''password123'\'').hexdigest())"\n\n  2. Custom cracker (reads wordlist from stdin):\n     echo -e "admin\\npassword\\npassword123\\n123456" | md5crack\n\n  3. John the Ripper:\n     john --format=raw-md5 challenge/admin.hash --wordlist=/usr/share/wordlists/rockyou.txt\n     (Note: rockyou may not be installed; use python3 approach)\n' \
    > /home/analyst/readme.txt && chown analyst:analyst /home/analyst/readme.txt

WORKDIR /home/analyst
USER analyst
CMD ["/bin/bash"]
