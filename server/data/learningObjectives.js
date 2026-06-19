/**
 * Learning objectives per topic — matched to challenges/labs by title keywords.
 */

const OBJECTIVES = {
  sqli: [
    'Understand SQL Injection fundamentals',
    'Identify injectable parameters in web forms',
    'Use UNION-based extraction techniques',
    'Enumerate database tables and columns',
    'Extract credentials or sensitive data safely'
  ],
  xss: [
    'Understand reflected, stored, and DOM-based XSS',
    'Identify where user input is rendered unencoded',
    'Craft context-appropriate XSS payloads',
    'Demonstrate impact without harming the environment',
    'Retrieve the flag via script execution'
  ],
  cmdInjection: [
    'Understand OS command injection risks',
    'Recognize shell metacharacters (; | && `)',
    'Test diagnostic and network utility endpoints',
    'Chain commands to read sensitive files',
    'Capture proof of command execution'
  ],
  lfi: [
    'Understand Local File Inclusion and path traversal',
    'Identify file/path parameters in the application',
    'Bypass basic directory traversal filters',
    'Read sensitive files on the server filesystem',
    'Escalate from LFI to flag extraction'
  ],
  privesc: [
    'Enumerate SUID binaries and misconfigurations',
    'Identify privilege escalation vectors on Linux',
    'Exploit misconfigured binaries or permissions',
    'Escalate from low-privilege to root access',
    'Retrieve the root-level flag'
  ],
  cronPrivesc: [
    'Enumerate scheduled cron jobs and scripts',
    'Identify writable cron scripts or PATH abuse',
    'Inject a payload into a vulnerable cron job',
    'Wait for execution and verify privilege gain',
    'Read the elevated flag after cron runs'
  ],
  linuxEnum: [
    'Perform basic Linux host enumeration',
    'Identify users, groups, and running services',
    'Locate interesting files and configurations',
    'Map the attack surface of the environment',
    'Use findings to reach the flag'
  ],
  linuxPerms: [
    'Read and interpret Linux file permissions',
    'Find world-readable or misconfigured files',
    'Understand SUID and special permission bits',
    'Access restricted data through permission flaws',
    'Extract the flag from exposed files'
  ],
  networkPcap: [
    'Analyze network packet captures (PCAP)',
    'Apply Wireshark/tcpdump filters effectively',
    'Follow TCP streams and extract cleartext data',
    'Identify credentials or flags in traffic',
    'Document findings from network evidence'
  ],
  forensicsStego: [
    'Perform forensic triage on provided artifacts',
    'Extract metadata and hidden data from files',
    'Apply steganography detection techniques',
    'Recover concealed messages or flags',
    'Preserve evidence integrity during analysis'
  ],
  forensicsEncoding: [
    'Recognize common encoding schemes (Base64, hex, etc.)',
    'Decode layered or chained encodings',
    'Use strings and file analysis for triage',
    'Recover plaintext or flag from encoded data',
    'Document the decoding methodology'
  ],
  hashCrack: [
    'Identify weak or unsalted hash algorithms',
    'Use wordlists and cracking tools appropriately',
    'Recover plaintext from captured hashes',
    'Understand password storage best practices',
    'Submit the cracked flag or credential'
  ],
  sshBrute: [
    'Understand SSH authentication weaknesses',
    'Enumerate valid usernames and services',
    'Apply controlled credential testing in scope',
    'Gain shell access via discovered credentials',
    'Complete post-access objectives for the flag'
  ],
  dns: [
    'Understand DNS record types (A, AAAA, MX, TXT, CNAME)',
    'Query and interpret DNS responses',
    'Find flags or secrets in DNS records',
    'Apply DNS enumeration methodology',
    'Document DNS-based findings'
  ],
  ports: [
    'Identify common network ports and services',
    'Map services to known vulnerabilities',
    'Interpret port scan or service banner data',
    'Connect port knowledge to exploitation paths',
    'Apply findings to capture the flag'
  ],
  headers: [
    'Inspect HTTP request and response headers',
    'Identify sensitive data leaked in headers',
    'Understand security-related header misconfigurations',
    'Use proxy tools to manipulate and observe headers',
    'Extract the flag from header artifacts'
  ],
  metadata: [
    'Extract file metadata with forensic tools',
    'Identify hidden information in EXIF and properties',
    'Correlate metadata to challenge clues',
    'Recover embedded or referenced secrets',
    'Submit findings in FLAG format'
  ],
  webGeneric: [
    'Map the web application attack surface',
    'Test user inputs for injection and logic flaws',
    'Use a proxy to inspect and modify HTTP traffic',
    'Validate vulnerabilities with minimal proof',
    'Capture the flag through web exploitation'
  ],
  linuxGeneric: [
    'Enumerate the Linux environment systematically',
    'Identify misconfigurations and weak permissions',
    'Chain enumeration findings into exploitation',
    'Use command-line tools safely in the lab',
    'Retrieve the flag from the compromised host'
  ],
  networkGeneric: [
    'Analyze network services and traffic artifacts',
    'Apply protocol knowledge to find weaknesses',
    'Extract secrets from cleartext or misconfigured services',
    'Document network-based attack paths',
    'Recover the flag from network evidence'
  ],
  forensicsGeneric: [
    'Triage digital artifacts without altering evidence',
    'Apply strings, metadata, and specialized extractors',
    'Identify steganography or hidden data channels',
    'Recover concealed flags from files or images',
    'Present a clear forensic analysis trail'
  ],
  cryptoGeneric: [
    'Identify the cryptographic or encoding scheme in use',
    'Select appropriate decoding or cracking tools',
    'Break weak ciphers or recover hashed values',
    'Understand why the scheme is vulnerable',
    'Reveal the flag from decrypted or cracked data'
  ]
};

const GENERIC_BY_CATEGORY = {
  web: OBJECTIVES.webGeneric,
  linux: OBJECTIVES.linuxGeneric,
  network: OBJECTIVES.networkGeneric,
  forensics: OBJECTIVES.forensicsGeneric,
  crypto: OBJECTIVES.cryptoGeneric
};

const RULES = [
  { match: /sql\s*injection|sqli/i, key: 'sqli' },
  { match: /xss|cross.site/i, key: 'xss' },
  { match: /command\s*injection|cmd\s*inj/i, key: 'cmdInjection' },
  { match: /lfi|file\s*inclusion|directory\s*traversal|path\s*traversal/i, key: 'lfi' },
  { match: /privilege\s*escalation|privesc|suid/i, key: 'privesc' },
  { match: /cron/i, key: 'cronPrivesc' },
  { match: /enumeration|enum/i, key: 'linuxEnum' },
  { match: /permission/i, key: 'linuxPerms' },
  { match: /packet|wireshark|traffic|network\s*capture/i, key: 'networkPcap' },
  { match: /steganography|stego|plain\s*sight/i, key: 'forensicsStego' },
  { match: /base64|decode|encoding/i, key: 'forensicsEncoding' },
  { match: /hash|md5|crack/i, key: 'hashCrack' },
  { match: /ssh|brute/i, key: 'sshBrute' },
  { match: /dns/i, key: 'dns' },
  { match: /port/i, key: 'ports' },
  { match: /header/i, key: 'headers' },
  { match: /metadata/i, key: 'metadata' }
];

function getLearningObjectives(title, category) {
  const t = title || '';
  for (const rule of RULES) {
    if (rule.match.test(t)) {
      return [...(OBJECTIVES[rule.key] || [])];
    }
  }
  return [...(GENERIC_BY_CATEGORY[category] || OBJECTIVES.webGeneric)];
}

module.exports = { getLearningObjectives, OBJECTIVES };
