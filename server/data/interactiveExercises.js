/** Interactive learning exercises — MCQ, fill, drag, mini practical */

const mcq = (id, question, options, correctIndex, explanation) => ({
  id, type: 'mcq', question, options, correctIndex, explanation
});

const fill = (id, question, answer, acceptable, explanation) => ({
  id, type: 'fill', question, answer,
  acceptable: acceptable || [answer],
  explanation
});

const drag = (id, question, items, correctOrder, explanation) => ({
  id, type: 'drag', question, items, correctOrder, explanation
});

const mini = (id, question, answer, acceptable, explanation) => ({
  id, type: 'mini', question, answer,
  acceptable: (acceptable || [answer]).map(a => String(a).toLowerCase()),
  explanation
});

const SETS = {
  sqli: [
    mcq('sqli-1', 'What is the root cause of SQL injection?', [
      'Weak TLS configuration',
      'User input concatenated into SQL strings',
      'Missing antivirus software',
      'Using HTTPS instead of HTTP'
    ], 1, 'SQLi happens when applications build queries with string concatenation instead of parameterized statements.'),
    fill('sqli-2', 'A classic login bypass payload uses OR and comments. Complete: admin\' OR \'1\'=\'1\' ___', '--', ['--', '-- ', '#', '/*'], 'The double-dash (or # in MySQL) comments out the rest of the query so the password check is ignored.'),
    drag('sqli-3', 'Order the safe SQL handling workflow:', [
      { id: 'input', label: 'Receive user input' },
      { id: 'bind', label: 'Bind input as parameters' },
      { id: 'query', label: 'Execute prepared statement' },
      { id: 'concat', label: 'Concatenate into query string' }
    ], ['input', 'bind', 'query'], 'Never concatenate — bind parameters, then execute. "Concatenate" is the vulnerable anti-pattern.'),
    mini('sqli-4', 'Which OWASP category does SQL injection belong to? (one word)', 'Injection', ['injection', 'a03 injection', 'a03'], 'SQL injection is the archetypal Injection flaw in the OWASP Top 10.')
  ],

  xss: [
    mcq('xss-1', 'Reflected XSS differs from stored XSS because:', [
      'It only affects the attacker\'s browser',
      'The payload is immediately echoed in the response to that request',
      'It requires root access to the server',
      'It cannot steal cookies'
    ], 1, 'Reflected XSS bounces off the server in the same response — typical in search/error pages.'),
    fill('xss-2', 'To run JS in HTML context, attackers often inject a ___ tag.', 'script', ['script', '<script>', 'script tag'], 'The script tag is the classic vector; modern defenses also block event handlers and javascript: URLs.'),
    mcq('xss-3', 'Which HTTP cookie flag reduces cookie theft via document.cookie?', [
      'Secure',
      'HttpOnly',
      'SameSite',
      'Path'
    ], 1, 'HttpOnly prevents JavaScript from reading the cookie — critical against XSS cookie theft.'),
    drag('xss-4', 'Order XSS output encoding priority (first step first):', [
      { id: 'identify', label: 'Identify output context (HTML/attr/JS)' },
      { id: 'encode', label: 'Apply context-appropriate encoding' },
      { id: 'csp', label: 'Deploy Content-Security-Policy' },
      { id: 'reflect', label: 'Reflect raw user input' }
    ], ['identify', 'encode', 'csp'], 'Context first, encode second, CSP as layer three. Never reflect raw input.')
  ],

  cmdInjection: [
    mcq('cmdi-1', 'Command injection typically abuses:', [
      'SQL prepared statements',
      'Shell metacharacters like ; | &&',
      'JPEG metadata',
      'DNS TTL values'
    ], 1, 'Semicolons, pipes, and && chain attacker commands after legitimate input.'),
    fill('cmdi-2', 'To append a command after ping 127.0.0.1, use the ___ character.', ';', [';', 'semicolon', '|', '&&'], 'Semicolon terminates the first command and starts the next in most Unix shells.'),
    mini('cmdi-3', 'Type the Linux command often used to read files in cmd injection PoCs:', 'cat', ['cat', 'type', 'more'], 'cat is commonly chained after injection to dump flag files.')
  ],

  lfi: [
    mcq('lfi-1', 'Directory traversal primarily targets:', [
      'TLS certificate stores',
      'File read/include paths on the server',
      'GPU memory',
      'Browser cache only'
    ], 1, 'LFI/traversal reads files the app should not expose via ../ sequences.'),
    fill('lfi-2', 'Classic Unix passwd read path: ../../../etc/___', 'passwd', ['passwd', '/etc/passwd'], '/etc/passwd proves arbitrary file read on Linux targets.'),
    mini('lfi-3', 'URL-encode a dot for filter bypass (two chars):', '%2e', ['%2e', '%2E', '%252e'], '%2e is the encoded form of "." used to bypass naive filters.')
  ],

  privesc: [
    mcq('priv-1', 'SUID binaries run with:', [
      'The caller\'s groups only',
      'The file owner\'s effective privileges',
      'Kernel ring 0 always',
      'No special privileges'
    ], 1, 'Setuid executables elevate to the owner UID — dangerous when misconfigured.'),
    fill('priv-2', 'Find SUID files: find / -perm -u=s -type f 2>/___', 'dev/null', ['/dev/null', 'dev/null'], 'Redirect stderr to /dev/null to hide permission-denied noise.'),
    drag('priv-3', 'Linux privesc checklist order:', [
      { id: 'id', label: 'Check id / whoami' },
      { id: 'sudo', label: 'Run sudo -l' },
      { id: 'suid', label: 'Find SUID binaries' },
      { id: 'exploit', label: 'Exploit misconfiguration' }
    ], ['id', 'sudo', 'suid', 'exploit'], 'Enumerate identity and sudo first, then SUID, then exploit.')
  ],

  linuxEnum: [
    mcq('enum-1', 'Hidden files in Linux start with:', [
      'A dash (-)',
      'A dot (.)',
      'An underscore (_)',
      'A hash (#)'
    ], 1, 'Dotfiles like .bash_history are hidden from plain ls without -a.'),
    mini('enum-2', 'Command to list ALL files including hidden in current dir:', 'ls -la', ['ls -la', 'ls -a', 'ls -al'], 'ls -la shows permissions, hidden files, and ownership.'),
    fill('enum-3', 'Show current user: ___', 'whoami', ['whoami', 'id'], 'whoami prints the effective username.')
  ],

  networkPcap: [
    mcq('net-1', 'Which tool is primarily used for interactive PCAP analysis?', [
      'Nmap',
      'Wireshark',
      'Hashcat',
      'Burp Suite'
    ], 1, 'Wireshark is the standard GUI protocol analyzer for PCAP files.'),
    mcq('net-2', 'Which HTTP header identifies the client browser and OS?', [
      'User-Agent',
      'Referer',
      'Host',
      'Cookie'
    ], 0, 'User-Agent identifies the client software. Referer shows the previous page; Host is the target hostname.'),
    fill('net-3', 'Filter Wireshark for HTTP POST: http.request.method == "___"', 'POST', ['POST', 'post'], 'Display filters use Wireshark\'s field syntax.'),
    mini('net-4', 'Command-line tool to read a PCAP file as text (name only):', 'tcpdump', ['tcpdump', 'tshark'], 'tcpdump -r file.pcap reads captures from the CLI.')
  ],

  forensicsStego: [
    mcq('stego-1', 'Steganography hides data in:', [
      'Plain sight inside other files',
      'Only encrypted TLS streams',
      'CPU registers exclusively',
      'Git commit hashes only'
    ], 0, 'Stego conceals payloads inside images/audio — obscurity, not strong encryption.'),
    mini('stego-2', 'CLI tool to extract steghide payloads (name only):', 'steghide', ['steghide'], 'steghide extract -sf image.jpg is the classic workflow.'),
    fill('stego-3', 'Quick strings search command: ___', 'strings', ['strings'], 'strings surfaces printable text hidden in binaries and images.')
  ],

  forensicsEncoding: [
    mcq('enc-1', 'Base64 encoded text length is usually a multiple of:', [
      '3',
      '4',
      '8',
      '16'
    ], 1, 'Base64 output length is divisible by 4 (with = padding).'),
    mini('enc-2', 'Decode base64 in Linux terminal (command only):', 'base64 -d', ['base64 -d', 'base64 -D', 'base64 --decode'], 'Pipe or echo encoded text into base64 -d.'),
    fill('enc-3', 'Cybersecurity students often use ___ Chef for encoding chains.', 'Cyber', ['Cyber', 'cyberchef', 'CyberChef'], 'CyberChef (gchq.github.io/CyberChef) automates decode chains.')
  ],

  hashCrack: [
    mcq('hash-1', 'MD5 is considered broken for password storage because:', [
      'It is too slow',
      'It is fast to compute — enabling offline brute force',
      'It uses 512-bit keys',
      'It requires a GPU driver'
    ], 1, 'Fast hashes fall to dictionary attacks; use Argon2/bcrypt instead.'),
    mini('hash-2', 'hashcat mode -m 0 cracks which hash?', 'MD5', ['md5', 'MD5'], 'Mode 0 = raw MD5 in hashcat.'),
    fill('hash-3', 'Slow password hash algorithm recommended: Argon2 or ___', 'bcrypt', ['bcrypt', 'scrypt'], 'Memory-hard algorithms resist offline cracking.')
  ],

  sshBrute: [
    mcq('ssh-1', 'SSH brute force targets:', [
      'UDP port 53',
      'TCP port 22 (by default)',
      'ICMP echo',
      'ARP tables'
    ], 1, 'SSH listens on 22 by default — rate limiting and keys mitigate brute force.'),
    mini('ssh-2', 'Tool often used for protocol brute force (name only):', 'hydra', ['hydra', 'medusa'], 'Hydra supports SSH, FTP, HTTP forms, and more.')
  ],

  cronPrivesc: [
    mcq('cron-1', 'Cron privesc works when a root cron job runs a:', [
      'Read-only script you cannot touch',
      'World-writable script you can modify',
      'TLS certificate',
      'Browser cookie'
    ], 1, 'Writable scripts executed as root let low-priv users inject commands.'),
    fill('cron-2', 'System-wide cron file path: /etc/___', 'crontab', ['crontab'], '/etc/crontab lists system cron entries on many Linux distros.')
  ],

  linuxPerms: [
    mcq('perm-1', 'In ls -la, the first rwx triplet applies to:', [
      'All users on the internet',
      'The file owner',
      'The group only',
      'The kernel'
    ], 1, 'Owner | group | other — three permission triplets.'),
    mini('perm-2', 'Find world-writable files: find / -perm -o+w -type f 2>/dev/null — what does -o+w mean?', 'other write', ['other write', 'others can write', 'world writable'], '-o+w matches files writable by "others".')
  ],

  web: [
    mcq('web-1', 'Which HTTP header identifies the browser and operating system?', [
      'User-Agent',
      'Referer',
      'Host',
      'Cookie'
    ], 0, 'User-Agent string identifies client software — critical for fingerprinting and analytics.'),
    mcq('web-2', 'Which header tells the server which site the browser intended to reach?', [
      'User-Agent',
      'Referer',
      'Host',
      'Set-Cookie'
    ], 2, 'Host specifies the virtual host on shared IP servers.'),
    fill('web-3', 'Intercept HTTP traffic with Burp ___ (proxy mode).', 'Proxy', ['Proxy', 'proxy'], 'Burp Proxy sits between browser and server for inspection.'),
    drag('web-4', 'OWASP testing flow:', [
      { id: 'map', label: 'Map inputs & endpoints' },
      { id: 'test', label: 'Test injection & auth flaws' },
      { id: 'report', label: 'Document & report findings' },
      { id: 'deploy', label: 'Deploy to production first' }
    ], ['map', 'test', 'report'], 'Map → test → report. Never deploy-untested.')
  ],

  linux: [
    mcq('linux-1', 'The SUID permission bit means:', [
      'File deletes itself after execution',
      'Process runs with file owner privileges',
      'File is invisible',
      'Network port opens automatically'
    ], 1, 'SUID elevation is a common privesc vector when binaries are misconfigured.'),
    mini('linux-2', 'Command to check sudo rights:', 'sudo -l', ['sudo -l', 'sudo -L'], 'sudo -l lists allowed commands for the current user.')
  ],

  network: [
    mcq('netg-1', 'Cleartext HTTP sends credentials:', [
      'Encrypted with AES by default',
      'Readable to anyone on the network path',
      'Only to DNS servers',
      'Inside ICMP packets only'
    ], 1, 'Without TLS, HTTP bodies and headers are visible on the wire.'),
    mcq('netg-2', 'Which header identifies the browser?', [
      'User-Agent',
      'Referer',
      'Host',
      'Cookie'
    ], 0, 'User-Agent is the client identification header.')
  ],

  forensics: [
    mcq('for-1', 'Chain of custody ensures:', [
      'Faster internet speeds',
      'Evidence integrity and documented handling',
      'Automatic malware removal',
      'GPU acceleration'
    ], 1, 'Every handler and hash must be recorded for legal admissibility.'),
    fill('for-2', 'Verify evidence integrity with SHA-___ hashes.', '256', ['256', '256 ', 'sha256'], 'SHA-256 fingerprints detect tampering.')
  ],

  crypto: [
    mcq('crypto-1', 'Hashing differs from encryption because hashing is:', [
      'Reversible with the right key',
      'One-way — you cannot recover the original from the hash alone',
      'Only for images',
      'Always 128 bytes'
    ], 1, 'Hashes verify integrity; encryption protects confidentiality with reversal via key.'),
    mini('crypto-2', 'TLS commonly runs on port:', '443', ['443', '443 ', 'https'], 'HTTPS = HTTP over TLS on port 443.')
  ],

  default: [
    mcq('def-1', 'The CIA triad includes Confidentiality, Integrity, and:', [
      'Availability',
      'Anonymity',
      'Authentication',
      'Acceleration'
    ], 0, 'CIA = Confidentiality, Integrity, Availability — core security principles.'),
    mcq('def-2', 'Which HTTP header identifies the browser?', [
      'User-Agent',
      'Referer',
      'Host',
      'Cookie'
    ], 0, 'User-Agent identifies client browser/OS — a fundamental HTTP concept.'),
    fill('def-3', 'CTF flags usually look like: FLAG{___}', '...}', ['}', 'flag}', 'text}'], 'CyberLab uses FLAG{...} format for submissions.')
  ]
};

const RULES = [
  { match: /sql\s*injection|sqli/i, key: 'sqli' },
  { match: /xss|cross.site/i, key: 'xss' },
  { match: /command\s*injection|cmd\s*inj/i, key: 'cmdInjection' },
  { match: /lfi|file\s*inclusion|directory\s*traversal|path\s*traversal/i, key: 'lfi' },
  { match: /cron/i, key: 'cronPrivesc' },
  { match: /privilege\s*escalation|privesc|suid/i, key: 'privesc' },
  { match: /enumeration|enum/i, key: 'linuxEnum' },
  { match: /permission/i, key: 'linuxPerms' },
  { match: /packet|wireshark|traffic|network\s*capture/i, key: 'networkPcap' },
  { match: /steganography|stego|plain\s*sight|metadata/i, key: 'forensicsStego' },
  { match: /base64|decode|encoding/i, key: 'forensicsEncoding' },
  { match: /hash|md5|crack/i, key: 'hashCrack' },
  { match: /ssh|brute/i, key: 'sshBrute' }
];

const CATEGORY_SET = {
  web: 'web',
  linux: 'linux',
  network: 'network',
  forensics: 'forensics',
  crypto: 'crypto'
};

function getInteractivesForItem(title, category) {
  const t = title || '';
  for (const rule of RULES) {
    if (rule.match.test(t) && SETS[rule.key]) {
      return JSON.parse(JSON.stringify(SETS[rule.key]));
    }
  }
  const catKey = CATEGORY_SET[category];
  if (catKey && SETS[catKey]) {
    return JSON.parse(JSON.stringify(SETS[catKey]));
  }
  return JSON.parse(JSON.stringify(SETS.default));
}

function attachInteractives(lesson, title, category) {
  lesson.interactives = getInteractivesForItem(title, category);
  lesson.interactiveMode = true;
  return lesson;
}

module.exports = { getInteractivesForItem, attachInteractives, SETS };
