/**
 * Theory lesson templates — matched to challenges/labs by title keywords.
 * Structure: 📖 Theory | 🧪 Example | ⚠️ Common mistakes | 🛡️ Defense | 🎯 Lab
 */

const sqli = {
  theory: {
    content: 'SQL Injection (SQLi) occurs when user input is concatenated into SQL queries instead of being passed as bound parameters. Attackers can alter query logic to bypass authentication, read sensitive data, modify records, or in worst cases execute OS commands (if the DB allows it).',
    bullets: [
      'In-band SQLi — results appear directly in the app response',
      'Blind SQLi — no direct output; infer truth via timing or boolean responses',
      'Error-based SQLi — database errors leak schema hints',
      'Why it happens: dynamic string-built queries, missing input validation, over-privileged DB accounts'
    ]
  },
  example: {
    content: 'A vulnerable login query might look like this on the server:',
    code: "SELECT * FROM users WHERE username = '${user}' AND password = '${pass}'",
    bullets: [
      "Payload: admin' OR '1'='1' --",
      "Resulting query always returns rows because '1'='1' is true",
      'Real-world: login bypasses, credit card dumps (Heartland Payment Systems), mass data breaches via UNION SELECT'
    ]
  },
  commonMistakes: {
    bullets: [
      'Only testing the username field — password and hidden parameters matter too',
      'Assuming WAF blocks mean the app is safe — encoding bypasses exist',
      'Using destructive payloads (DROP TABLE) in live engagements',
      'Forgetting URL encoding for spaces and quotes in GET parameters',
      'Not confirming impact — always prove data access or auth bypass safely'
    ]
  },
  defense: {
    bullets: [
      'Use parameterized queries / prepared statements (never string concat)',
      'ORMs with bound parameters; avoid raw query concatenation',
      'Least-privilege DB accounts — no FILE or xp_cmdshell rights',
      'Input validation as defense-in-depth (not a sole fix)',
      'WAF + monitoring for SQL error patterns and anomaly detection',
      'Regular code review and DAST/SAST in CI/CD'
    ]
  },
  labGoal: {
    content: 'Apply what you learned: find the injection point, craft a payload that bypasses authentication or extracts the flag, and submit it in FLAG{...} format.',
    bullets: [
      'Identify where user input reaches a SQL query',
      'Test with quotes and boolean conditions',
      'Escalate from detection to exploitation',
      'Capture the flag without damaging the environment'
    ]
  }
};

const xss = {
  theory: {
    content: 'Cross-Site Scripting (XSS) injects malicious JavaScript into pages viewed by other users. Reflected XSS echoes input in the immediate response; stored XSS persists in the database; DOM-based XSS executes entirely in the browser without server reflection.',
    bullets: [
      'Impact: session theft, keylogging, defacement, phishing overlays, worm propagation',
      'Root cause: rendering untrusted input as HTML/JS without encoding',
      'Context matters: HTML body, attribute, JavaScript, and URL contexts need different encodings'
    ]
  },
  example: {
    content: 'A search page that reflects the query unsanitized:',
    code: '<p>You searched for: ${userQuery}</p>\n<!-- Attacker input: -->\n<script>alert(document.cookie)</script>',
    bullets: [
      'Reflected: victim clicks crafted link with payload in URL',
      'Stored: payload saved in comments/posts affecting all visitors',
      'Real-world: Samy worm (MySpace), British Airways Magecart skimmers'
    ]
  },
  commonMistakes: {
    bullets: [
      'Only trying <script> — event handlers like onerror= work too',
      'Ignoring CSP — test bypass vectors if policy exists',
      'Testing only alert(1) without demonstrating impact (cookie theft PoC)',
      'Forgetting HTML entity encoding in different contexts',
      'Assuming HttpOnly cookies fully stop XSS impact (actions still possible)'
    ]
  },
  defense: {
    bullets: [
      'Context-aware output encoding (HTML, attribute, JS, CSS)',
      'Content Security Policy (CSP) restricting script sources',
      'HttpOnly + Secure + SameSite cookie flags',
      'Input validation with allowlists where possible',
      'Use modern frameworks that auto-escape by default',
      'Sanitize rich HTML with trusted libraries (DOMPurify) if HTML is required'
    ]
  },
  labGoal: {
    content: 'Locate reflected or stored input, inject a working XSS payload, and retrieve the flag exposed when the script executes.',
    bullets: [
      'Confirm your input appears unencoded in the response',
      'Craft a minimal proof payload',
      'Observe the flag in the page, alert, or DOM after execution'
    ]
  }
};

const cmdInjection = {
  theory: {
    content: 'OS Command Injection happens when user input is passed to system shells (exec, system(), ping -c, etc.) without sanitization. Attackers append shell metacharacters to run arbitrary commands on the server.',
    bullets: [
      'Metacharacters: ; | && || ` $( ) > < &',
      'Often found in network tools, diagnostics, image processors, legacy admin panels',
      'Impact: full remote code execution under the web server OS user'
    ]
  },
  example: {
    content: 'Vulnerable ping utility:',
    code: `system("ping -c 1 " . $_GET['host']);\n# Payload host=127.0.0.1; cat /flag.txt`,
    bullets: [
      'Semicolon starts a new command in bash/sh',
      'Pipe | chains commands; backticks execute subshells',
      'Real-world: Shellshock, vulnerable IoT admin panels'
    ]
  },
  commonMistakes: {
    bullets: [
      'Not trying different separators (; | && newline %0a)',
      'Giving up after spaces are stripped — ${IFS}, $IFS$9, tab tricks',
      'Running reverse shells in shared lab environments without permission'
    ]
  },
  defense: {
    bullets: [
      'Never call shell with user input — use language APIs instead',
      'Strict allowlist validation (e.g. valid IP/hostname regex only)',
      'Run services as low-privilege users with seccomp/AppArmor',
      'Disable dangerous functions in PHP/Python if not needed'
    ]
  },
  labGoal: {
    content: 'Abuse the command injection point to read the flag file on the server filesystem.',
    bullets: ['Find the parameter passed to a system command', 'Chain a read command after a valid input', 'Extract FLAG{...} from output']
  }
};

const lfi = {
  theory: {
    content: 'Local File Inclusion (LFI) and directory traversal abuse file inclusion or path parameters to read files outside the intended directory — configs, credentials, source code, flags.',
    bullets: [
      'Classic payload: ../../../etc/passwd',
      'PHP wrappers: php://filter/convert.base64-encode/resource=index.php',
      'Can escalate to RCE via log poisoning or /proc/self/environ in misconfigs'
    ]
  },
  example: {
    content: 'Vulnerable include:',
    code: `include("pages/" . $_GET['page'] . ".php");\n# ?page=../../etc/passwd%00 (legacy null byte)`,
    bullets: [
      'Each ../ walks up one directory level',
      'URL-encode dots: %2e%2e%2f bypasses naive filters',
      'Real-world: widely exploited in WordPress plugins and legacy portals'
    ]
  },
  commonMistakes: {
    bullets: [
      'Only testing /etc/passwd — app files and flag paths matter',
      'Missing double-encoding bypasses',
      'Ignoring Windows paths (..\\..\\) on IIS/ASP apps'
    ]
  },
  defense: {
    bullets: [
      'Avoid user-controlled paths; use ID-to-file mapping',
      'chroot/jail or strict base directory with realpath() checks',
      'Deny ../ sequences and null bytes',
      'Never expose include() on raw user strings'
    ]
  },
  labGoal: {
    content: 'Traverse the path parameter to read sensitive files and find the hidden flag.',
    bullets: ['Observe the file inclusion parameter', 'Enumerate path depth with ../', 'Read the flag file location']
  }
};

const privesc = {
  theory: {
    content: 'Linux privilege escalation moves from a low-privilege shell to root (or another privileged user) by abusing misconfigurations: SUID binaries, sudo rules, cron jobs, writable PATH, kernel exploits, and credential reuse.',
    bullets: [
      'Enumeration first: id, sudo -l, find SUID, crontab, capabilities',
      'GTFOBins documents misused binaries',
      'Always document the privesc vector for your report'
    ]
  },
  example: {
    content: 'World-writable SUID or cron script:',
    code: `find / -perm -u=s -type f 2>/dev/null\ncrontab -l\ncat /etc/crontab`,
    bullets: [
      'SUID find with -exec can spawn root shell: find . -exec /bin/sh -p \\;',
      'Cron running writable script as root — inject commands',
      'Real-world: misconfigured Docker sockets, leaked .env with root creds'
    ]
  },
  commonMistakes: {
    bullets: [
      'Skipping enumeration scripts (LinPEAS, manual checks)',
      'Running kernel exploits without checking version/compatibility',
      'Not checking sudo -l and group memberships',
      'Ignoring capabilities (getcap -r / 2>/dev/null)'
    ]
  },
  defense: {
    bullets: [
      'Remove unnecessary SUID bits; audit with find regularly',
      'Principle of least privilege for cron and service accounts',
      'Immutable infrastructure and patched kernels',
      'Monitor for suspicious privilege changes and root logins'
    ]
  },
  labGoal: {
    content: 'Escalate privileges on the Linux system and read the root-only flag.',
    bullets: ['Enumerate as the low-priv user', 'Identify the weak configuration', 'Exploit safely and capture FLAG{...}']
  }
};

const linuxEnum = {
  theory: {
    content: 'Linux enumeration is the systematic discovery of users, files, processes, network config, and misconfigurations on a system. It is the foundation of both pentesting and forensics on Unix-like hosts.',
    bullets: [
      'Start with context: whoami, id, hostname, uname -a, pwd',
      'Filesystem: ls -la, find, locate, hidden dotfiles',
      'Network: ip a, ss -tulpn, /etc/hosts, env vars'
    ]
  },
  example: {
    content: 'Essential enumeration one-liners:',
    code: `whoami && id\nls -la ~\nfind / -name "*flag*" 2>/dev/null\nenv | sort`,
    bullets: [
      'Hidden files start with . (e.g. .bash_history)',
      'Readable backups and configs often hold credentials',
      'SUID/find/cron checks come after basic orientation'
    ]
  },
  commonMistakes: {
    bullets: [
      'Not redirecting stderr (2>/dev/null) during broad finds',
      'Overlooking user home and /tmp directories',
      'Skipping history files and note files left by admins'
    ]
  },
  defense: {
    bullets: [
      'Restrict read permissions on sensitive files',
      'Remove leftover flags/credentials from user-accessible paths',
      'Audit world-readable files regularly',
      'Centralized logging of suspicious find/exec patterns'
    ]
  },
  labGoal: {
    content: 'Practice basic enumeration commands to locate hidden files and capture the flag.',
    bullets: ['Orient yourself on the system', 'Search for flag artifacts', 'Read the flag file']
  }
};

const networkPcap = {
  theory: {
    content: 'Network traffic analysis inspects packets and flows to find credentials, malware C2, data exfiltration, and protocol abuse. Analysts use PCAP files, NetFlow, and SIEM aggregated logs.',
    bullets: [
      'HTTP/FTP/Telnet may carry cleartext credentials',
      'DNS tunneling and beaconing show in timing and query patterns',
      'Wireshark display filters narrow millions of packets'
    ]
  },
  example: {
    content: 'Useful Wireshark filters:',
    code: `http.request.method == "POST"\nhttp contains "password"\nfollow tcp stream`,
    bullets: [
      'tcpdump -r capture.pcap -A | grep -i password',
      'Extract files: Wireshark → Export Objects → HTTP',
      'Real-world: incident responders reconstruct breach timelines from PCAPs'
    ]
  },
  commonMistakes: {
    bullets: [
      'Reading raw hex without following TCP streams',
      'Ignoring DNS and ICMP side channels',
      'Not checking both directions of a conversation'
    ]
  },
  defense: {
    bullets: [
      'Enforce TLS everywhere; disable legacy cleartext protocols',
      'Full packet capture at strategic network points',
      'Network detection rules for anomalous DNS volume',
      'Encrypt sensitive data in application layer too'
    ]
  },
  labGoal: {
    content: 'Analyze the provided capture or traffic artifact to extract credentials or the embedded flag.',
    bullets: ['Locate capture files on the system', 'Search for plaintext secrets', 'Submit the discovered FLAG{...}']
  }
};

const forensicsStego = {
  theory: {
    content: 'Steganography hides data inside other files (images, audio, text) so presence is not obvious. Forensics analysts use entropy analysis, strings, metadata, and specialized tools to extract hidden payloads.',
    bullets: [
      'Stego ≠ encryption — obscurity, not strong confidentiality',
      'Common carriers: PNG/JPG, WAV, PDF, whitespace in text',
      'Tools: steghide, zsteg, binwalk, exiftool, strings'
    ]
  },
  example: {
    content: 'Quick triage commands:',
    code: `strings image.png | grep FLAG\nexiftool image.png\nsteghide extract -sf image.png`,
    bullets: [
      'Check file headers with xxd or file command',
      'Trailing data after IEND in PNG may hold secrets',
      'Real-world: malware hides C2 configs in images'
    ]
  },
  commonMistakes: {
    bullets: [
      'Only running strings once — try steghide with empty passphrase',
      'Ignoring metadata and comment fields',
      'Not checking for nested archives (binwalk -e)'
    ]
  },
  defense: {
    bullets: [
      'DLP scanning for anomalous file entropy',
      'Strip metadata on upload',
      'Compare file hashes against known good baselines',
      'Train analysts on stego toolchains'
    ]
  },
  labGoal: {
    content: 'Extract the hidden flag from the provided file using forensic techniques.',
    bullets: ['Identify the carrier file type', 'Run strings and metadata analysis', 'Use stego tools if needed']
  }
};

const forensicsEncoding = {
  theory: {
    content: 'Encoding schemes (Base64, hex, URL encoding, rot13) transform data for transport — not security. Attackers and CTF authors layer encodings to obscure flags and credentials.',
    bullets: [
      'Base64 uses A-Za-z0-9+/ with = padding',
      'Recognize patterns: hex only 0-9a-f, base64 length multiple of 4',
      'CyberChef automates decode chains'
    ]
  },
  example: {
    content: 'Repeated Base64 decode:',
    code: `echo "RkxBR3tzb21lX2ZsYWd9" | base64 -d\n# FLAG{some_flag}`,
    bullets: [
      'Decode repeatedly until FLAG{ or readable text appears',
      'Try hex: echo ... | xxd -r -p',
      'Real-world: malware configs often base64-wrap JSON'
    ]
  },
  commonMistakes: {
    bullets: [
      'Stopping after one decode layer',
      'Confusing URL encoding (%41) with Base64',
      'Wrong alphabet (Base64url uses -_ instead of +/)'
    ]
  },
  defense: {
    bullets: [
      'Do not rely on encoding for secrecy',
      'Detect exfil via encoded blobs in logs',
      'Validate and normalize input before processing'
    ]
  },
  labGoal: {
    content: 'Peel encoding layers to reveal the plaintext flag.',
    bullets: ['Identify encoding type', 'Decode iteratively', 'Submit FLAG{...}']
  }
};

const hashCrack = {
  theory: {
    content: 'Password hashes are one-way functions protecting stored credentials. Analysts crack weak hashes offline using wordlists and rules; defenders use slow algorithms (bcrypt, Argon2) and salting.',
    bullets: [
      'MD5/SHA1 — fast, broken for passwords',
      'Salting prevents rainbow table reuse',
      'Tools: hashcat, John the Ripper, online breach lookups (authorized only)'
    ]
  },
  example: {
    content: 'Identify and crack MD5:',
    code: `echo -n password | md5sum\n# hashcat -m 0 -a 0 hash.txt wordlist.txt`,
    bullets: [
      'Mode -m 0 = MD5 in hashcat',
      'Start with rockyou.txt for CTF/lab contexts',
      'Real-world: NTLM relay and cracked creds enable lateral movement'
    ]
  },
  commonMistakes: {
    bullets: [
      'Wrong hashcat mode (-m) for algorithm',
      'Not trying common passwords before huge wordlists',
      'Cracking without authorization outside lab/CTF scope'
    ]
  },
  defense: {
    bullets: [
      'Use Argon2id/bcrypt/scrypt with per-user salt',
      'MFA so hash theft is insufficient',
      'Monitor for mass authentication failures',
      'Never store reversible passwords'
    ]
  },
  labGoal: {
    content: 'Crack the provided hash, recover the password, and unlock the flag.',
    bullets: ['Identify hash type', 'Run dictionary attack', 'Use recovered secret to get FLAG{...}']
  }
};

const sshBrute = {
  theory: {
    content: 'SSH brute force attempts many username/password pairs against remote login. Weak passwords fall quickly; keys and rate limiting stop most attacks.',
    bullets: [
      'Hydra/Medusa automate protocol login attempts',
      'Always verify scope — unauthorized brute force is illegal',
      'Success gives remote shell access'
    ]
  },
  example: {
    content: 'Hydra SSH example (authorized lab only):',
    code: `hydra -l victim -P wordlist.txt ssh://target -t 4\nsshpass -p 'pass' ssh user@target`,
    bullets: [
      'Tune threads (-t) to avoid lockouts in real engagements',
      'Try default creds before full brute',
      'Real-world: ransomware actors brute RDP/SSH on exposed hosts'
    ]
  },
  commonMistakes: {
    bullets: [
      'Brute forcing without account lockout awareness',
      'Using huge threads on production (DoS/lockout)',
      'Skipping key-based auth testing'
    ]
  },
  defense: {
    bullets: [
      'Key-based auth; disable password auth if possible',
      'fail2ban / rate limiting / bastion hosts',
      'No SSH on public internet without VPN',
      'Strong password policy and MFA'
    ]
  },
  labGoal: {
    content: 'Discover weak SSH credentials and access the target to read the flag.',
    bullets: ['Start SSH service if needed', 'Brute force with provided wordlist', 'SSH in and capture FLAG{...}']
  }
};

const cronPrivesc = {
  theory: {
    content: 'Cron schedules commands on Linux. If a root cron job runs a script writable by low-priv users, injecting commands achieves privilege escalation when cron fires.',
    bullets: [
      'Check /etc/crontab, /etc/cron.*, user crontab -l',
      'Writable scripts + root execution = trivial privesc',
      'Wait for schedule interval after injection'
    ]
  },
  example: {
    content: 'Writable cleanup script run by root cron:',
    code: `echo 'cp /root/flag.txt /tmp/f' >> /opt/scripts/cleanup.sh\n# wait for cron minute boundary`,
    bullets: [
      'ls -la on script paths referenced in crontab',
      'Watch for wildcard tar tricks in cron too',
      'Real-world: common misconfig in internal servers'
    ]
  },
  commonMistakes: {
    bullets: [
      'Not waiting long enough for cron to execute',
      'Missing systemd timers (systemctl list-timers)',
      'Forgetting to make output file readable after copy'
    ]
  },
  defense: {
    bullets: [
      'Root scripts must not be world-writable',
      'Run cron jobs as dedicated service users',
      'Audit crontabs in configuration management',
      'Immutable scripts or signed execution'
    ]
  },
  labGoal: {
    content: 'Find the vulnerable cron job, inject a payload, wait for execution, and read the root flag.',
    bullets: ['Enumerate cron configuration', 'Modify the writable script', 'Retrieve FLAG{...} after cron runs']
  }
};

const linuxPerms = {
  theory: {
    content: 'Linux file permissions (rwx for user/group/other) and ACLs control who can read, write, or execute files. Misconfigurations expose secrets to unauthorized users.',
    bullets: [
      'ls -la shows drwxr-xr-x and owner/group',
      'SUID bit (chmod u+s) runs as file owner',
      'World-readable /etc/shadow backups = credential leak'
    ]
  },
  example: {
    content: 'Find unusual permissions:',
    code: `find / -perm -o+w -type f 2>/dev/null\nfind / -readable -name "*flag*" 2>/dev/null`,
    bullets: [
      'Group memberships may grant access: id',
      'Sticky bit on /tmp prevents others deleting your files',
      'Capabilities extend beyond classic rwx'
    ]
  },
  commonMistakes: {
    bullets: [
      'Only checking current directory, not full filesystem',
      'Ignoring group-readable sensitive files',
      'Missing ACLs (getfacl)'
    ]
  },
  defense: {
    bullets: [
      'chmod least privilege; avoid world-readable secrets',
      'Regular audit with find -perm',
      'Use centralized secrets management'
    ]
  },
  labGoal: {
    content: 'Find a file with weak permissions that contains the flag.',
    bullets: ['Enumerate permissions', 'Locate readable flag files', 'Submit FLAG{...}']
  }
};

const genericByCategory = {
  web: {
    theory: { content: 'Web application security focuses on HTTP-layer attacks: injection, broken auth, XSS, misconfigurations, and business logic flaws. Always map user input to server-side sinks.', bullets: ['Follow OWASP Testing Guide', 'Proxy traffic through Burp/ZAP', 'Understand session and cookie security'] },
    example: { content: 'Typical workflow: spider the app → identify inputs → test injection and access control → document findings.', bullets: ['Check all parameters including headers and cookies', 'Test both GET and POST'] },
    commonMistakes: { bullets: ['Testing only the homepage', 'Ignoring API endpoints', 'Not checking authenticated areas'] },
    defense: { bullets: ['Secure SDLC', 'Parameterized queries', 'Output encoding', 'Regular pentests'] },
    labGoal: { content: 'Exploit the web vulnerability described in this challenge/lab and capture the flag.', bullets: ['Map the attack surface', 'Validate the vulnerability', 'Extract FLAG{...}'] }
  },
  linux: {
    theory: { content: 'Linux security challenges test command-line skills, permission models, and misconfiguration abuse on Unix systems.', bullets: ['Enumerate before exploiting', 'Document commands for reports', 'Respect lab scope'] },
    example: { content: 'Standard flow: whoami → enumerate files and cron/sudo → exploit weakness → read flag.', code: 'id && sudo -l && find / -perm -u=s 2>/dev/null' },
    commonMistakes: { bullets: ['Skipping basic enumeration', 'Dangerous commands on shared systems'] },
    defense: { bullets: ['Patching', 'Least privilege', 'Audit SUID and cron'] },
    labGoal: { content: 'Use Linux enumeration and exploitation techniques to retrieve the flag.', bullets: ['Explore the environment', 'Chain findings to access flag'] }
  },
  network: {
    theory: { content: 'Network security labs cover traffic analysis, protocol weaknesses, credential exposure, and service exploitation.', bullets: ['PCAP analysis', 'Service version detection', 'Cleartext protocol risks'] },
    example: { content: 'Use Wireshark/tcpdump filters to isolate interesting conversations.', bullets: ['Follow TCP streams', 'Check DNS and HTTP'] },
    commonMistakes: { bullets: ['Analyzing without filters', 'Missing encrypted vs cleartext distinction'] },
    defense: { bullets: ['TLS everywhere', 'Network segmentation', 'IDS/IPS monitoring'] },
    labGoal: { content: 'Analyze network artifacts or services to discover the flag.', bullets: ['Locate network evidence', 'Extract secrets or flag'] }
  },
  forensics: {
    theory: { content: 'Digital forensics challenges train you to extract evidence from files, images, and logs without destroying integrity.', bullets: ['Preserve hashes', 'Use strings/metadata first', 'Specialized tools second'] },
    example: { content: 'Triage: file → strings → exiftool → specialized extractors.', bullets: ['Document chain of analysis'] },
    commonMistakes: { bullets: ['Modifying original evidence', 'One-tool-only approach'] },
    defense: { bullets: ['Integrity monitoring', 'DLP', 'User training'] },
    labGoal: { content: 'Forensically analyze the provided artifact and recover FLAG{...}.', bullets: ['Identify artifact type', 'Extract hidden data'] }
  },
  crypto: {
    theory: { content: 'Cryptography challenges involve encoding, weak ciphers, hash cracking, and implementation flaws — not breaking AES-256 by brute force.', bullets: ['Identify the scheme', 'Use appropriate tools', 'Layered encoding is common'] },
    example: { content: 'CyberChef and Python scripts automate decode/crack workflows.', bullets: ['Check for classical ciphers in CTF contexts'] },
    commonMistakes: { bullets: ['Wrong algorithm assumption', 'Ignoring salt/key hints in files'] },
    defense: { bullets: ['Modern algorithms (AES-GCM, Argon2)', 'Never roll your own crypto'] },
    labGoal: { content: 'Break or decode the cryptographic challenge to reveal the flag.', bullets: ['Analyze the crypto scheme', 'Recover plaintext FLAG{...}'] }
  }
};

/** Keyword → template mapping (order matters — first match wins) */
const RULES = [
  { match: /sql\s*injection|sqli/i, template: sqli },
  { match: /xss|cross.site/i, template: xss },
  { match: /command\s*injection|cmd\s*inj/i, template: cmdInjection },
  { match: /lfi|file\s*inclusion|directory\s*traversal|path\s*traversal/i, template: lfi },
  { match: /privilege\s*escalation|privesc|suid/i, template: privesc },
  { match: /cron/i, template: cronPrivesc },
  { match: /enumeration|enum/i, template: linuxEnum },
  { match: /permission/i, template: linuxPerms },
  { match: /packet|wireshark|traffic|network\s*capture/i, template: networkPcap },
  { match: /steganography|stego|plain\s*sight/i, template: forensicsStego },
  { match: /base64|decode|encoding/i, template: forensicsEncoding },
  { match: /hash|md5|crack/i, template: hashCrack },
  { match: /ssh|brute/i, template: sshBrute }
];

const { attachInteractives } = require('./interactiveExercises');
const { attachVideos } = require('./videoLessons');

function getTheoryForItem(title, category) {
  const t = title || '';
  let lesson;
  for (const rule of RULES) {
    if (rule.match.test(t)) {
      lesson = { enabled: true, ...JSON.parse(JSON.stringify(rule.template)) };
      break;
    }
  }
  if (!lesson) {
    const generic = genericByCategory[category];
    lesson = generic
      ? { enabled: true, ...JSON.parse(JSON.stringify(generic)) }
      : {
        enabled: true,
        theory: { content: 'Review the security concepts for this topic before attempting the practical exercise.', bullets: [] },
        example: { content: 'Apply standard methodology for this category.', bullets: [] },
        commonMistakes: { bullets: ['Rushing without reading the description', 'Skipping enumeration'] },
        defense: { bullets: ['Follow secure coding and hardening best practices'] },
        labGoal: { content: 'Complete the challenge/lab and submit the flag.', bullets: ['Read the description', 'Use hints if stuck', 'Submit FLAG{...}'] }
      };
  }
  attachInteractives(lesson, title, category);
  return attachVideos(lesson, title, category);
}

module.exports = { getTheoryForItem, templates: { sqli, xss, cmdInjection, lfi, privesc } };
