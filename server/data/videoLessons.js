/**
 * Video lessons per topic — YouTube embeds + instructor + walkthrough slots.
 * All youtubeId values are verified via YouTube oEmbed (embeddable).
 */

const vid = (id, type, title, description, youtubeId, duration, instructor = 'CyberLab') => ({
  id, type, title, description, youtubeId, duration, instructor
});

const SETS = {
  sqli: [
    vid('sqli-yt', 'youtube', 'SQL Injection Explained', 'How SQLi works and why string concatenation is dangerous.', '_jKylhJtPmI', '8:59', 'Computerphile'),
    vid('sqli-inst', 'instructor', 'Instructor: SQLi Attack Surface', 'Where to look for injection points in web apps and how to test safely in labs.', 'ciNHn38EyRc', '12:04', 'Computerphile'),
    vid('sqli-walk', 'walkthrough', 'Lab Walkthrough: SQL Injection', 'Methodology for login-bypass labs — concepts only, no flag spoilers.', 'Sf3FbOVcKQI', '6:00', 'CyberLab Team')
  ],
  xss: [
    vid('xss-yt', 'youtube', 'Cross-Site Scripting (XSS)', 'Reflected, stored, and DOM-based XSS fundamentals.', 'L5l9lSnNMxg', '6:53', 'Computerphile'),
    vid('xss-inst', 'instructor', 'Instructor: XSS Contexts', 'HTML, attribute, and JavaScript contexts — encoding rules that matter.', 'DqK_OYat-3M', '7:10', 'CyberLab Team'),
    vid('xss-walk', 'walkthrough', 'Lab Walkthrough: Reflected XSS', 'How to confirm reflection and craft a proof-of-concept payload.', 'T1QEs3mdJoc', '8:44', 'Computerphile')
  ],
  cmdInjection: [
    vid('cmdi-yt', 'youtube', 'Command Injection Basics', 'How shell metacharacters lead to RCE.', 'ezKpgKjvePI', '18:00', 'TryHackMe'),
    vid('cmdi-inst', 'instructor', 'Instructor: Safe Command Injection Testing', 'Scope, impact, and minimal PoC discipline.', '441YMjOtE1E', '6:30', 'CyberLab Team'),
    vid('cmdi-walk', 'walkthrough', 'Walkthrough: Ping Utility Labs', 'Testing separators and reading command output in diagnostics tools.', 'Sf3FbOVcKQI', '6:00', 'CyberLab Team')
  ],
  lfi: [
    vid('lfi-yt', 'youtube', 'Directory Traversal / LFI', 'Path manipulation and file inclusion risks.', 'XhieEh9BlGc', '5:30', 'PortSwigger'),
    vid('lfi-inst', 'instructor', 'Instructor: Path Traversal Filters', 'Bypass techniques and secure include patterns.', 'fTRuSEiPXfg', '45:00', 'TryHackMe'),
    vid('lfi-walk', 'walkthrough', 'Walkthrough: LFI Labs', 'Finding the parameter and escalating to sensitive files.', '37JYRKmjx4k', '35:00', 'TryHackMe')
  ],
  privesc: [
    vid('priv-yt', 'youtube', 'Linux Privilege Escalation Intro', 'SUID, sudo, and misconfiguration vectors.', 'nj-dYB3D2dA', '12:00', 'SANS'),
    vid('priv-inst', 'instructor', 'Instructor: Linux Enum Checklist', 'Manual enumeration before automated scripts.', 'cVlWTE7IJCs', '2:30', 'CyberLab Team'),
    vid('priv-walk', 'walkthrough', 'Walkthrough: Privesc Labs', 'From low shell to root flag — methodology without spoilers.', 'PklVdCseez8', '2:00:00', 'TryHackMe')
  ],
  linuxEnum: [
    vid('enum-yt', 'youtube', 'Linux for Hackers', 'Essential commands every pentester needs.', 'VbEx7B_PTOE', '11:32', 'NetworkChuck'),
    vid('enum-inst', 'instructor', 'Instructor: Enumeration Mindset', 'What to look for on an unfamiliar Linux box.', 'UVyfM_hzxnM', '1:30:00', 'TryHackMe'),
    vid('enum-walk', 'walkthrough', 'Walkthrough: Basic Linux Lab', 'Step-by-step orientation on a fresh shell.', 'nj-dYB3D2dA', '12:00', 'CyberLab Team')
  ],
  networkPcap: [
    vid('net-yt', 'youtube', 'Wireshark for Beginners', 'Capture files, filters, and following streams.', 'NdTu3bDTBbo', '30:22', 'LanWanNinja'),
    vid('net-inst', 'instructor', 'Instructor: HTTP Headers Deep Dive', 'User-Agent, Host, Referer, Cookie — what analysts need to know.', '9MSd3-T3Y58', '8:00', 'CyberLab Team'),
    vid('net-walk', 'walkthrough', 'Walkthrough: Traffic Analysis Lab', 'Finding credentials and flags in PCAP/text captures.', 'QxCMxXjqkyA', '1:07:00', 'SharkFest')
  ],
  forensicsStego: [
    vid('stego-yt', 'youtube', 'Steganography Introduction', 'Hiding data in plain sight — concepts and tools.', '2sKENpzPt6w', '10:00', 'Kilt Guy'),
    vid('stego-inst', 'instructor', 'Instructor: Forensic Triage', 'strings, exiftool, steghide workflow.', '3uMSIR1ViIs', '15:00', 'CyberLab Team'),
    vid('stego-walk', 'walkthrough', 'Walkthrough: Stego Challenges', 'Artifact hunting without destroying evidence.', '8UfJMMD6HGU', '25:00', 'CyberLab Team')
  ],
  forensicsEncoding: [
    vid('enc-yt', 'youtube', 'Encoding vs Encryption', 'Base64, hex, and layered encoding in CTFs.', '8v4moossLXo', '8:30', 'CyberLab'),
    vid('enc-inst', 'instructor', 'Instructor: Decode Chains', 'Using CyberChef and CLI tools iteratively.', 'Q56T1TrKhLg', '1:00', 'CyberLab Team'),
    vid('enc-walk', 'walkthrough', 'Walkthrough: Encoding Labs', 'Peeling layers until you see FLAG{.', 'y2ay7otbFWk', '6:00', 'W3C')
  ],
  hashCrack: [
    vid('hash-yt', 'youtube', 'Password Hashing Explained', 'Why MD5 fails and what to use instead.', '8ZtInClXe1Q', '10:00', 'Computerphile'),
    vid('hash-inst', 'instructor', 'Instructor: Hashcat Basics', 'Modes, wordlists, and lab-safe cracking.', '7U-RbOKanYs', '12:00', 'Computerphile'),
    vid('hash-walk', 'walkthrough', 'Walkthrough: Hash Cracking Lab', 'Identify algorithm → dictionary attack → unlock vault.', 'J8A8rKFZW-M', '10:00', 'CyberLab Team')
  ],
  sshBrute: [
    vid('ssh-yt', 'youtube', 'SSH Security Fundamentals', 'Keys vs passwords and brute-force risks.', 'lTyVksdhddY', '20:00', 'NetworkChuck'),
    vid('ssh-inst', 'instructor', 'Instructor: Hydra for Authorized Labs', 'Responsible brute force in scoped environments.', 'mCv7t4Uoj2I', '12:00', 'CyberLab Team'),
    vid('ssh-walk', 'walkthrough', 'Walkthrough: SSH Brute Lab', 'Wordlists, rate limits, and post-login enumeration.', 'LVN9twJoeH8', '25:00', 'CyberLab Team')
  ],
  cronPrivesc: [
    vid('cron-yt', 'youtube', 'Cron Jobs & Linux Scheduling', 'How cron works and why writable scripts are deadly.', 'UVyfM_hzxnM', '1:30:00', 'TryHackMe'),
    vid('cron-inst', 'instructor', 'Instructor: Cron Privesc Pattern', 'Finding and abusing root-owned writable scripts.', '4xectsHBfCQ', '5:41', 'CyberLab Team'),
    vid('cron-walk', 'walkthrough', 'Walkthrough: Cron Privesc Lab', 'Injection, waiting for execution, reading the flag.', 'PklVdCseez8', '2:00:00', 'TryHackMe')
  ],
  linuxPerms: [
    vid('perm-yt', 'youtube', 'Linux File Permissions', 'rwx, ownership, and special bits explained.', '4e669hSjaX8', '35:48', 'Learn Linux TV'),
    vid('perm-inst', 'instructor', 'Instructor: Permission Hunting', 'find-based discovery of weak ACLs.', 'LnKoncbQBsM', '5:00', 'CyberLab Team'),
    vid('perm-walk', 'walkthrough', 'Walkthrough: Permissions Lab', 'Locating world-readable secrets.', 'MAnVifGzbkY', '15:00', 'CyberLab Team')
  ],
  web: [
    vid('web-yt', 'youtube', 'OWASP Top 10 Overview', 'The most critical web application risks.', 'hryt-rCLJUA', '8:00', 'OWASP'),
    vid('web-inst', 'instructor', 'Instructor: HTTP for Hackers', 'Headers, cookies, sessions, and proxy workflow.', '2_lswM1S264', '3:00:00', 'CyberLab Team'),
    vid('web-walk', 'walkthrough', 'Walkthrough: Web Labs', 'Burp setup, mapping inputs, and submitting flags.', 'M9JDQtR16Ls', '1:00:00', 'Tib3rius')
  ],
  linux: [
    vid('linux-yt', 'youtube', 'Linux Basics for Security', 'Shell, permissions, and process model.', 'VbEx7B_PTOE', '11:32', 'NetworkChuck'),
    vid('linux-inst', 'instructor', 'Instructor: Shell Discipline', 'Documenting commands and safe enumeration.', 'UVyfM_hzxnM', '1:30:00', 'CyberLab Team'),
    vid('linux-walk', 'walkthrough', 'Walkthrough: Linux Labs', 'From first shell to flag.', 'PklVdCseez8', '2:00:00', 'TryHackMe')
  ],
  network: [
    vid('netg-yt', 'youtube', 'Network Security Basics', 'TCP/IP, ports, and cleartext protocol risks.', 'NdTu3bDTBbo', '30:22', 'LanWanNinja'),
    vid('netg-inst', 'instructor', 'Instructor: Packet Analysis Mindset', 'What to filter first in an investigation.', '3uMSIR1ViIs', '15:00', 'CyberLab Team'),
    vid('netg-walk', 'walkthrough', 'Walkthrough: Network Labs', 'Artifacts, grep, and Wireshark tips.', '8alJCyXwRZQ', '20:00', 'CyberLab Team')
  ],
  forensics: [
    vid('for-yt', 'youtube', 'Digital Forensics Intro', 'Evidence, chain of custody, and triage.', '2sKENpzPt6w', '10:00', 'Kilt Guy'),
    vid('for-inst', 'instructor', 'Instructor: Forensic Tools', 'strings, exiftool, hashing workflow.', '8UfJMMD6HGU', '25:00', 'CyberLab Team'),
    vid('for-walk', 'walkthrough', 'Walkthrough: Forensics Challenges', 'Preserving integrity while hunting flags.', '3CaG2GI1kn0', '30:00', 'NetworkChuck')
  ],
  crypto: [
    vid('crypto-yt', 'youtube', 'Cryptography Crash Course', 'Hashing, symmetric, and asymmetric crypto.', '8ZtInClXe1Q', '10:00', 'Computerphile'),
    vid('crypto-inst', 'instructor', 'Instructor: Crypto in CTFs', 'Identifying schemes and using tools.', '7U-RbOKanYs', '12:00', 'Computerphile'),
    vid('crypto-walk', 'walkthrough', 'Walkthrough: Crypto Labs', 'Crack, decode, submit.', 'uttdV662i88', '0:37', 'CyberLab Team')
  ],
  default: [
    vid('def-yt', 'youtube', 'Cybersecurity Fundamentals', 'CIA triad, threats, and careers overview.', 'SBcDGb9l6yo', '5:00', 'Professor Messer'),
    vid('def-inst', 'instructor', 'Instructor: How CyberLab Labs Work', 'Theory → video → quiz → hands-on → certificates.', 'WO7wP3QaJ_g', '10:00', 'CyberLab Team'),
    vid('def-walk', 'walkthrough', 'Platform Walkthrough', 'Starting labs, terminals, and flag submission.', '2_lswM1S264', '3:00:00', 'CyberLab Team')
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
  web: 'web', linux: 'linux', network: 'network', forensics: 'forensics', crypto: 'crypto'
};

function getVideosForItem(title, category) {
  const t = title || '';
  for (const rule of RULES) {
    if (rule.match.test(t) && SETS[rule.key]) {
      return JSON.parse(JSON.stringify(SETS[rule.key]));
    }
  }
  const catKey = CATEGORY_SET[category];
  if (catKey && SETS[catKey]) return JSON.parse(JSON.stringify(SETS[catKey]));
  return JSON.parse(JSON.stringify(SETS.default));
}

function attachVideos(lesson, title, category) {
  lesson.videos = getVideosForItem(title, category);
  return lesson;
}

module.exports = { getVideosForItem, attachVideos, SETS };
