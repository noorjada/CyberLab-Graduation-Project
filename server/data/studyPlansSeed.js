/**
 * Industry-aligned study plans (PTES, OWASP, MITRE ATT&CK, NIST IR, SANS DFIR).
 * All platform links resolve to real challenges, labs, exams, and reference articles.
 */

const {
  challenge, lab, labs, reference, referenceCat, exam, external, topic,
  CHALLENGES, LABS, EXAMS, REF
} = require('./studyPlanResources');

const STUDY_PLANS = [
  {
    slug: '30-day-pentester',
    title: '30-Day Pentester Plan',
    subtitle: 'PTES-aligned path from fundamentals to full attack chains',
    description: 'A day-by-day penetration testing roadmap aligned with PTES, OWASP Testing Guide, and OSCP-style foundations. Each day maps to CyberLab labs, challenges, theory lessons, and reference material — with external anchors to MITRE ATT&CK and NIST where appropriate.',
    career: 'pentester',
    duration: '30 days',
    durationDays: 30,
    icon: '🕷️',
    color: '#3fb950',
    featured: true,
    order: 1,
    outcomes: [
      'Apply PTES reconnaissance and enumeration methodology',
      'Exploit OWASP Top 10 web flaws (SQLi, XSS, LFI, command injection)',
      'Operate confidently on Linux targets (enum, shells, privesc)',
      'Chain findings into documented attack narratives suitable for real engagements',
      'Understand legal scope, rules of engagement, and responsible disclosure'
    ],
    phases: [
      {
        id: 'week-1',
        title: 'Week 1: Foundations & Networking',
        description: 'Security mindset, TCP/IP, DNS, OSINT, and traffic analysis — the base every pentester builds on (PTES Intelligence Gathering + Vulnerability Analysis).',
        order: 1,
        topics: [
          topic('d01-ethics', 'Day 1: Ethical hacking mindset & lab setup', 'Understand scope, authorization, and how to use CyberLab safely before touching targets.', {
            day: 1, hours: 2,
            objectives: ['Define rules of engagement', 'Set up terminal and notes workflow', 'Read platform safety guidelines'],
            frameworks: ['PTES Pre-engagement', 'EC-Council Code of Ethics'],
            links: [
              reference(REF.ETHICAL_HACKING, 'Ethical hacking fundamentals'),
              reference(REF.LEGAL, 'Legal & ethical framework'),
              labs('Browse all labs', null),
              external('https://owasp.org/www-project-web-security-testing-guide/', 'OWASP Testing Guide')
            ]
          }),
          topic('d02-cia', 'Day 2: Security fundamentals (CIA triad)', 'Learn confidentiality, integrity, and availability — how defenders think and what you are testing for.', {
            day: 2, hours: 2,
            objectives: ['Explain CIA triad', 'Relate threats to security pillars', 'Identify impact of successful exploits'],
            frameworks: ['NIST CSF Govern', 'CompTIA Security+ 1.0'],
            links: [
              reference(REF.CIA, 'CIA triad & security fundamentals'),
              reference(REF.PENTESTER, 'Penetration tester role'),
              external('https://www.nist.gov/cyberframework', 'NIST Cybersecurity Framework')
            ]
          }),
          topic('d03-tcpip', 'Day 3: TCP/IP, OSI & attack surface', 'Map how packets flow and where services expose entry points during engagements.', {
            day: 3, hours: 3,
            objectives: ['Explain TCP three-way handshake', 'Map layers to troubleshooting', 'Identify common service ports'],
            frameworks: ['PTES Intelligence Gathering', 'MITRE T1046'],
            links: [
              reference(REF.NETWORK_PENTEST, 'Network penetration testing'),
              reference(REF.TOOLS, 'Essential security tools'),
              external('https://attack.mitre.org/techniques/T1046/', 'MITRE T1046 — Network Service Discovery')
            ]
          }),
          topic('d04-recon', 'Day 4: Reconnaissance & service enumeration', 'Passive and active recon — what to collect before exploitation.', {
            day: 4, hours: 3,
            objectives: ['Differentiate passive vs active recon', 'Interpret nmap-style output', 'Document findings systematically'],
            frameworks: ['PTES Intelligence Gathering', 'OSSTMM'],
            links: [
              reference(REF.OSINT, 'OSINT for investigations'),
              reference(REF.PTES, 'Penetration testing methodology'),
              external('https://nmap.org/book/man.html', 'Nmap reference documentation')
            ]
          }),
          topic('d05-dns', 'Day 5: DNS & OSINT pivoting', 'Use DNS records and open sources to expand attack surface legally.', {
            day: 5, hours: 3,
            objectives: ['Identify A, MX, TXT, CNAME, NS records', 'Pivot from DNS to subdomains', 'Correlate OSINT with scope'],
            frameworks: ['PTES Intelligence Gathering', 'MITRE T1590'],
            links: [
              reference(REF.OSINT, 'OSINT investigations guide'),
              referenceCat('pentesting', 'Pentesting reference library'),
              external('https://attack.mitre.org/techniques/T1590/', 'MITRE T1590 — Gather Victim Network Information')
            ]
          }),
          topic('d06-pcap', 'Day 6: Packet & traffic analysis', 'Read cleartext protocols and extract credentials from captures — essential for network pentests and CTFs.', {
            day: 6, hours: 4,
            objectives: ['Apply display filters', 'Follow TCP/HTTP streams', 'Extract credentials from plaintext traffic'],
            frameworks: ['Wireshark analysis workflow', 'MITRE T1040'],
            links: [
              challenge(CHALLENGES.PCAP, 'network'),
              lab(LABS.NETWORK),
              reference(REF.NETWORK_PENTEST, 'Network pentesting guide')
            ]
          }),
          topic('d07-review', 'Day 7: Week 1 review & assessment', 'Consolidate networking fundamentals with a certification-style check.', {
            day: 7, hours: 3,
            objectives: ['Complete Packet Capture challenge', 'Pass Beginner Exam (70%+)', 'Document weekly learnings in notes'],
            frameworks: ['CompTIA Security+ domains 2–4'],
            links: [
              exam(EXAMS.BEGINNER, 'Beginner Exam'),
              challenge(CHALLENGES.PCAP, 'network'),
              reference(REF.CERTS, 'Certifications roadmap')
            ]
          })
        ]
      },
      {
        id: 'week-2',
        title: 'Week 2: Web Application Security',
        description: 'OWASP Top 10 hands-on track — injection, XSS, traversal, and command execution (OWASP WSTG + Web Security Testing Guide).',
        order: 2,
        topics: [
          topic('d08-owasp', 'Day 8: OWASP Top 10 & web attack surface', 'Map the most critical web risks and how to test each category methodically.', {
            day: 8, hours: 3,
            objectives: ['List OWASP Top 10 2021 categories', 'Map risks to test cases', 'Set up proxy-based testing workflow'],
            frameworks: ['OWASP Top 10 2021', 'OWASP WSTG'],
            links: [
              reference(REF.WEB_PENTEST, 'Web application pentesting'),
              external('https://owasp.org/Top10/', 'OWASP Top 10 official'),
              external('https://portswigger.net/burp/documentation', 'Burp Suite documentation')
            ]
          }),
          topic('d09-sqli-theory', 'Day 9: SQL injection theory & challenge', 'Understand how unsanitized input alters SQL logic — then prove it on the challenge.', {
            day: 9, hours: 3,
            objectives: ['Explain SQLi root cause', 'Perform auth bypass PoC', 'Use UNION-based extraction concepts'],
            frameworks: ['OWASP A03 Injection', 'MITRE T1190', 'CWE-89'],
            links: [
              challenge(CHALLENGES.SQL_INJECTION, 'web'),
              reference(REF.WEB_PENTEST, 'SQLi testing methodology'),
              external('https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html', 'OWASP SQLi prevention cheat sheet')
            ]
          }),
          topic('d10-sqli-lab', 'Day 10: SQL injection hands-on lab', 'Full container lab — theory lesson, video, quiz, then live exploitation.', {
            day: 10, hours: 4,
            objectives: ['Complete theory + video steps', 'Bypass login via SQLi', 'Capture the lab flag'],
            frameworks: ['OWASP WSTG-INPVAL-005', 'PTES Exploitation'],
            links: [
              lab(LABS.SQLI),
              challenge(CHALLENGES.SQL_INJECTION, 'web'),
              reference(REF.WEB_PENTEST, 'Web pentesting deep dive')
            ]
          }),
          topic('d11-xss-theory', 'Day 11: XSS theory & challenge', 'Reflected XSS — contexts, encoding, and safe proof-of-concept discipline.', {
            day: 11, hours: 3,
            objectives: ['Differentiate reflected vs stored XSS', 'Identify injection contexts', 'Craft minimal PoC payload'],
            frameworks: ['OWASP A03 XSS', 'CWE-79', 'MITRE T1059.007'],
            links: [
              challenge(CHALLENGES.XSS, 'web'),
              reference(REF.WEB_PENTEST, 'XSS testing guide'),
              external('https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', 'OWASP XSS prevention')
            ]
          }),
          topic('d12-xss-lab', 'Day 12: Reflected XSS hands-on lab', 'Exploit a live search portal with guided theory and video lessons.', {
            day: 12, hours: 4,
            objectives: ['Confirm reflection point', 'Inject script PoC', 'Submit flag after theory path'],
            frameworks: ['OWASP WSTG-INPVAL-001'],
            links: [
              lab(LABS.XSS),
              challenge(CHALLENGES.XSS, 'web'),
              labs('All web labs', 'web')
            ]
          }),
          topic('d13-lfi', 'Day 13: LFI & directory traversal', 'Path manipulation to read sensitive files — challenge plus full LFI lab.', {
            day: 13, hours: 4,
            objectives: ['Test ../ traversal sequences', 'Read /etc/passwd in challenge', 'Escalate to flag in LFI lab'],
            frameworks: ['OWASP A01 Broken Access Control', 'CWE-22', 'MITRE T1083'],
            links: [
              challenge(CHALLENGES.TRAVERSAL, 'web'),
              lab(LABS.LFI),
              reference(REF.WEB_PENTEST, 'File inclusion testing')
            ]
          }),
          topic('d14-cmdi', 'Day 14: Command injection & web exam', 'OS command injection via web utilities — then validate with Web Security Exam.', {
            day: 14, hours: 5,
            objectives: ['Identify shell metacharacters', 'Complete Command Injection lab', 'Pass Web Security Exam (70%+)'],
            frameworks: ['OWASP A03 Injection', 'CWE-78', 'MITRE T1059'],
            links: [
              lab(LABS.CMD_INJ),
              exam(EXAMS.WEB, 'Web Security Exam'),
              external('https://owasp.org/www-community/attacks/Command_Injection', 'OWASP Command Injection')
            ]
          })
        ]
      },
      {
        id: 'week-3',
        title: 'Week 3: Linux & Access',
        description: 'Shell skills, enumeration, permissions, SSH, and credential attacks on Linux targets.',
        order: 3,
        topics: [
          topic('d15-linux-intro', 'Day 15: Linux fundamentals for pentesters', 'Essential commands, filesystem layout, and process model before live labs.', {
            day: 15, hours: 3,
            objectives: ['Navigate filesystem with cd/ls/find', 'Read man pages and --help', 'Understand users and groups'],
            frameworks: ['PTES Vulnerability Analysis', 'LPIC-1 foundations'],
            links: [
              lab(LABS.LINUX_ENUM),
              reference(REF.PTES, 'PTES methodology'),
              reference(REF.TOOLS, 'Linux security tools')
            ]
          }),
          topic('d16-enum', 'Day 16: Linux enumeration deep dive', 'Systematically map users, cron, services, and interesting files on an unfamiliar box.', {
            day: 16, hours: 4,
            objectives: ['Run structured enum checklist', 'Find hidden files and configs', 'Complete enumeration lab tasks'],
            frameworks: ['MITRE T1082', 'GTFOBins recon'],
            links: [
              lab(LABS.LINUX_ENUM),
              reference(REF.PTES, 'Post-exploitation enumeration'),
              external('https://gtfobins.github.io/', 'GTFOBins reference')
            ]
          }),
          topic('d17-perms', 'Day 17: Permissions & weak ACLs', 'Find world-readable secrets and misconfigured permissions.', {
            day: 17, hours: 3,
            objectives: ['Interpret ls -la output', 'Use find with -perm flags', 'Solve File Permissions challenge'],
            frameworks: ['CIS Linux Benchmark', 'MITRE T1222'],
            links: [
              challenge(CHALLENGES.PERMISSIONS, 'linux'),
              reference(REF.BLUE_TEAM, 'Defender perspective on permissions'),
              external('https://attack.mitre.org/techniques/T1222/', 'MITRE T1222 — File Permissions Modification')
            ]
          }),
          topic('d18-suid', 'Day 18: SUID & privilege paths', 'Discover SUID binaries and misconfigurations that enable escalation.', {
            day: 18, hours: 4,
            objectives: ['Find SUID with find -perm -4000', 'Correlate binaries with GTFOBins', 'Solve Linux Privilege Escalation challenge'],
            frameworks: ['MITRE T1548.001', 'CWE-269'],
            links: [
              challenge(CHALLENGES.LINUX_PRIVESC, 'linux'),
              lab(LABS.LINUX_PRIVESC),
              external('https://gtfobins.github.io/#+suid', 'GTFOBins SUID')
            ]
          }),
          topic('d19-ssh', 'Day 19: SSH access & brute force (scoped)', 'Responsible credential testing in authorized lab environments only.', {
            day: 19, hours: 4,
            objectives: ['Understand SSH auth mechanisms', 'Use Hydra in lab scope', 'Retrieve flag via SSH access'],
            frameworks: ['MITRE T1110.001', 'CIS SSH Benchmark'],
            links: [
              lab(LABS.SSH),
              reference(REF.LEGAL, 'Authorized testing scope'),
              external('https://attack.mitre.org/techniques/T1110/001/', 'MITRE T1110.001 — Password Guessing')
            ]
          }),
          topic('d20-hashes', 'Day 20: Password hashes & cracking', 'Identify weak hashing and crack passwords in controlled labs.', {
            day: 20, hours: 3,
            objectives: ['Differentiate hashing vs encryption', 'Crack MD5 in lab', 'Understand salting and bcrypt'],
            frameworks: ['OWASP ASVS V2', 'NIST SP 800-63B'],
            links: [
              lab(LABS.HASH),
              reference(REF.CRYPTO, 'Cryptography fundamentals'),
              challenge(CHALLENGES.BASE64, 'forensics')
            ]
          }),
          topic('d21-linux-exam', 'Day 21: Linux review & exam', 'Validate Linux security knowledge before privilege escalation week.', {
            day: 21, hours: 3,
            objectives: ['Review enum checklist', 'Pass Linux Security Exam (70%+)', 'Document privesc prep notes'],
            frameworks: ['CompTIA PenTest+ 2.2', 'eJPT Linux objectives'],
            links: [
              exam(EXAMS.LINUX, 'Linux Security Exam'),
              lab(LABS.LINUX_ENUM),
              reference(REF.CERTS, 'Certification paths')
            ]
          })
        ]
      },
      {
        id: 'week-4',
        title: 'Week 4: Privilege Escalation & Capstone',
        description: 'Root-level access techniques and end-to-end attack chains — the OSCP-style finish.',
        order: 4,
        topics: [
          topic('d22-privesc-method', 'Day 22: Privilege escalation methodology', 'Structured approach: enum → identify vector → exploit → prove impact.', {
            day: 22, hours: 3,
            objectives: ['Follow privesc checklist', 'Prioritize SUID, sudo, cron, kernels', 'Document escalation path'],
            frameworks: ['PTES Post-Exploitation', 'MITRE T1068'],
            links: [
              lab(LABS.LINUX_PRIVESC),
              reference(REF.PTES, 'Post-exploitation phase'),
              external('https://attack.mitre.org/tactics/TA0004/', 'MITRE Privilege Escalation tactics')
            ]
          }),
          topic('d23-suid-lab', 'Day 23: SUID exploitation lab', 'Hands-on root via misconfigured SUID binary in container environment.', {
            day: 23, hours: 4,
            objectives: ['Enumerate SUID binaries', 'Exploit find SUID vector', 'Read root flag'],
            frameworks: ['GTFOBins', 'MITRE T1548.001'],
            links: [
              lab(LABS.LINUX_PRIVESC),
              challenge(CHALLENGES.LINUX_PRIVESC, 'linux'),
              external('https://book.hacktricks.xyz/linux-hardening/privilege-escalation', 'HackTricks Linux privesc')
            ]
          }),
          topic('d24-cron', 'Day 24: Cron & scheduled task abuse', 'Writable cron scripts running as root — a classic privesc pattern.', {
            day: 24, hours: 4,
            objectives: ['Read /etc/crontab and user crontabs', 'Find writable scripts', 'Inject payload and capture flag'],
            frameworks: ['MITRE T1053.003', 'CWE-732'],
            links: [
              lab(LABS.CRON),
              reference(REF.PTES, 'Persistence & privesc'),
              external('https://attack.mitre.org/techniques/T1053/003/', 'MITRE T1053.003 — Cron')
            ]
          }),
          topic('d25-web-shell', 'Day 25: Web-to-shell attack chain', 'Chain command injection to shell access and post-exploitation.', {
            day: 25, hours: 5,
            objectives: ['Exploit web RCE vector', 'Stabilize shell', 'Enumerate from foothold'],
            frameworks: ['PTES Exploitation → Post-Exploitation', 'Cyber Kill Chain'],
            links: [
              lab(LABS.CMD_INJ),
              lab(LABS.LINUX_ENUM),
              reference(REF.WEB_PENTEST, 'Post-exploitation from web')
            ]
          }),
          topic('d26-full-web', 'Day 26: Full web attack chain', 'SQLi or LFI foothold through to sensitive data access.', {
            day: 26, hours: 5,
            objectives: ['Chain SQLi + data extraction', 'Complete LFI lab end-to-end', 'Write attack narrative'],
            frameworks: ['OWASP Testing Guide v4', 'PTES Reporting'],
            links: [
              lab(LABS.SQLI),
              lab(LABS.LFI),
              challenge(CHALLENGES.TRAVERSAL, 'web')
            ]
          }),
          topic('d27-reporting', 'Day 27: Reporting & client deliverables', 'Write findings executives and developers can act on.', {
            day: 27, hours: 3,
            objectives: ['Structure executive summary', 'Write reproducible steps', 'Assign risk ratings'],
            frameworks: ['PTES Reporting', 'CVSS v3.1', 'ISO 27001'],
            links: [
              reference(REF.PENTESTER, 'Pentester deliverables'),
              reference(REF.VULN_MGMT, 'Vulnerability management'),
              external('https://www.first.org/cvss/', 'CVSS specification')
            ]
          }),
          topic('d28-prep', 'Day 28: Capstone preparation', 'Review weak areas and plan unrestricted practice session.', {
            day: 28, hours: 3,
            objectives: ['Identify skill gaps from exams', 'Revisit failed challenges', 'Plan capstone attack chain'],
            frameworks: ['OSCP exam format awareness'],
            links: [
              reference(REF.CERTS, 'Pentest certification roadmap'),
              labs('All hacking labs', null),
              reference('learning-platforms-resources', 'Learning platforms & resources')
            ]
          }),
          topic('d29-capstone', 'Day 29: Capstone — unrestricted lab practice', 'Complete at least three labs end-to-end without walkthroughs.', {
            day: 29, hours: 6,
            objectives: ['Finish 3+ labs independently', 'Chain web + Linux findings', 'Time-box engagement (2h per lab)'],
            frameworks: ['PTES full lifecycle'],
            links: [
              lab(LABS.SQLI),
              lab(LABS.LINUX_PRIVESC),
              lab(LABS.CRON),
              labs('All labs', null)
            ]
          }),
          topic('d30-next', 'Day 30: Certification & next steps', 'Earn certificates, review roadmap, and plan advanced training.', {
            day: 30, hours: 2,
            objectives: ['Review earned certificates', 'Choose next cert (OSCP, PNPT, eJPT)', 'Set 90-day practice goals'],
            frameworks: ['CompTIA PenTest+', 'OSCP', 'PNPT'],
            links: [
              reference(REF.CERTS, 'Certifications roadmap'),
              { type: 'certificates', label: 'View your certificates', path: '/certificates' },
              { type: 'roadmap', label: 'Pentester learning path', path: '/roadmap' },
              external('https://www.offensive-security.com/pwk-oscp/', 'Offensive Security OSCP')
            ]
          })
        ]
      }
    ]
  },
  {
    slug: 'soc-analyst',
    title: 'SOC Analyst Plan',
    subtitle: 'Blue team path — logs, SIEM, detection, and incident response',
    description: 'Structured SOC analyst curriculum aligned with NIST IR, MITRE ATT&CK, and CompTIA CySA+ objectives. Progress from log triage through detection engineering to full incident response with CyberLab SOC tools, network challenges, and certification exams.',
    career: 'soc',
    duration: '6 weeks',
    durationDays: 42,
    icon: '👁️',
    color: '#58a6ff',
    featured: true,
    order: 2,
    outcomes: [
      'Parse Windows, Linux, and application security logs',
      'Write SIEM queries and correlation logic',
      'Map alerts to MITRE ATT&CK techniques',
      'Triage incidents using NIST IR lifecycle',
      'Produce actionable incident reports and detection improvements'
    ],
    phases: [
      {
        id: 'soc-foundations',
        title: 'Phase 1: SOC Foundations',
        description: 'Blue team mindset, log sources, and analyst workflows (NIST CSF Detect function).',
        order: 1,
        topics: [
          topic('soc-01-role', 'SOC operations & analyst role', 'Understand tiers (L1/L2/L3), shift handoffs, and escalation paths.', {
            week: 1, hours: 3,
            objectives: ['Describe SOC tier responsibilities', 'Define MTTD and MTTR', 'Identify key log sources'],
            frameworks: ['NIST CSF DE.CM', 'SANS SOC Survey'],
            links: [
              reference(REF.SOC_ROLE, 'SOC analyst role guide'),
              reference(REF.BLUE_TEAM, 'Blue team fundamentals'),
              { type: 'soc', label: 'SOC Assistant', path: '/soc' }
            ]
          }),
          topic('soc-02-cia', 'Defender mindset & CIA triad', 'Think like a defender — what are you protecting and how do attacks manifest in logs?', {
            week: 1, hours: 2,
            objectives: ['Apply CIA to monitoring priorities', 'Link threats to detective controls', 'Understand defense-in-depth'],
            frameworks: ['NIST CSF', 'CIS Controls v8'],
            links: [
              reference(REF.CIA, 'Security fundamentals'),
              reference(REF.GOVERNANCE, 'Governance frameworks'),
              exam(EXAMS.BEGINNER, 'Beginner Exam')
            ]
          }),
          topic('soc-03-logs', 'Log sources & formats', 'Windows Event Logs, Sysmon, auth.log, web logs, and cloud audit trails.', {
            week: 1, hours: 4,
            objectives: ['Identify high-value Windows events', 'Parse Linux auth.log entries', 'Normalize timestamps to UTC'],
            frameworks: ['MITRE T1070', 'CIS Logging Benchmark'],
            links: [
              reference(REF.BLUE_TEAM, 'Log analysis fundamentals'),
              reference(REF.IR, 'Incident response lifecycle'),
              external('https://www.sans.org/blog/the-windows-event-log-cheat-sheet/', 'SANS Windows Event Log cheat sheet')
            ]
          }),
          topic('soc-04-auth', 'Authentication & brute-force detection', 'Spot password spraying, brute force, and impossible travel in auth logs.', {
            week: 2, hours: 4,
            objectives: ['Detect failed login spikes', 'Identify successful brute force', 'Correlate SSH and web auth events'],
            frameworks: ['MITRE T1110', 'MITRE T1078'],
            links: [
              lab(LABS.SSH),
              challenge(CHALLENGES.PCAP, 'network'),
              external('https://attack.mitre.org/techniques/T1110/', 'MITRE T1110 — Brute Force')
            ]
          }),
          topic('soc-05-triage', 'Alert triage workflow', 'Structured validation before escalation — evidence, context, severity.', {
            week: 2, hours: 3,
            objectives: ['Apply triage checklist', 'Reduce false positives', 'Document escalation rationale'],
            frameworks: ['NIST IR Detect', 'SANS Incident Handler Handbook'],
            links: [
              { type: 'soc', label: 'SOC Assistant triage scenarios', path: '/soc' },
              reference(REF.IR, 'IR lifecycle'),
              { type: 'notes', label: 'Document triage notes', path: '/notes' }
            ]
          })
        ]
      },
      {
        id: 'soc-siem',
        title: 'Phase 2: SIEM & Detection Engineering',
        description: 'Query construction, correlation rules, and detection tuning.',
        order: 2,
        topics: [
          topic('soc-06-siem', 'SIEM concepts & search queries', 'Build time-bounded searches that answer investigative questions.', {
            week: 3, hours: 4,
            objectives: ['Write field-based queries', 'Use time windows effectively', 'Save and share hunts'],
            frameworks: ['Splunk ESCU', 'Sigma rules'],
            links: [
              reference(REF.BLUE_TEAM, 'Detection engineering'),
              external('https://github.com/SigmaHQ/sigma', 'Sigma detection rules'),
              { type: 'soc', label: 'SOC Assistant', path: '/soc' }
            ]
          }),
          topic('soc-07-correlation', 'Correlation rules & alert chaining', 'Connect events across sources to detect multi-stage attacks.', {
            week: 3, hours: 4,
            objectives: ['Design correlation logic', 'Reduce alert fatigue', 'Tune detection thresholds'],
            frameworks: ['MITRE ATT&CK mapping', 'Kill Chain correlation'],
            links: [
              reference(REF.IR, 'Detection in IR lifecycle'),
              external('https://attack.mitre.org/matrices/enterprise/', 'MITRE ATT&CK Matrix'),
              { type: 'roadmap', label: 'SOC career roadmap', path: '/roadmap' }
            ]
          }),
          topic('soc-08-network', 'Network traffic analysis for analysts', 'Use PCAP skills to validate C2, exfiltration, and credential theft hypotheses.', {
            week: 3, hours: 5,
            objectives: ['Analyze HTTP cleartext in captures', 'Identify beaconing patterns', 'Complete network challenge'],
            frameworks: ['MITRE T1041', 'MITRE T1071'],
            links: [
              challenge(CHALLENGES.PCAP, 'network'),
              lab(LABS.NETWORK),
              reference(REF.NETWORK_PENTEST, 'Network analysis (attacker view)')
            ]
          }),
          topic('soc-09-web-detect', 'Detecting web attacks', 'Understand SQLi, XSS, and LFI signatures in WAF and application logs.', {
            week: 4, hours: 4,
            objectives: ['Recognize SQLi in logs', 'Identify XSS payloads', 'Map to OWASP categories'],
            frameworks: ['OWASP Top 10', 'MITRE T1190'],
            links: [
              challenge(CHALLENGES.SQL_INJECTION, 'web'),
              challenge(CHALLENGES.XSS, 'web'),
              exam(EXAMS.WEB, 'Web Security Exam')
            ]
          }),
          topic('soc-10-dashboards', 'Dashboards, metrics & reporting', 'MTTD, MTTR, alert volume, and executive-ready summaries.', {
            week: 4, hours: 3,
            objectives: ['Track detection KPIs', 'Build analyst dashboards', 'Report trends to leadership'],
            frameworks: ['NIST CSF ID.RA', 'ISO 27001 metrics'],
            links: [
              reference(REF.GOVERNANCE, 'Governance & risk metrics'),
              exam(EXAMS.BEGINNER, 'Beginner Exam'),
              { type: 'exams', label: 'All practice exams', path: '/exams' }
            ]
          })
        ]
      },
      {
        id: 'soc-detection',
        title: 'Phase 3: Threat Detection & Intelligence',
        description: 'IOCs, ATT&CK mapping, malware triage, and behavioral analytics.',
        order: 3,
        topics: [
          topic('soc-11-iocs', 'IOCs & threat intelligence', 'Operationalize hashes, domains, IPs, and file indicators.', {
            week: 5, hours: 3,
            objectives: ['Validate IOC freshness', 'Hunt across log sources', 'Document intel provenance'],
            frameworks: ['STIX/TAXII', 'MITRE ATT&CK'],
            links: [
              { type: 'exploits', label: 'Threat intelligence feed', path: '/exploits' },
              { type: 'virustotal', label: 'Malware analysis (VirusTotal)', path: '/virustotal' },
              reference(REF.MALWARE, 'Malware analysis intro')
            ]
          }),
          topic('soc-12-attack', 'MITRE ATT&CK & TTP detection', 'Map observed behavior to technique IDs and build coverage maps.', {
            week: 5, hours: 4,
            objectives: ['Navigate ATT&CK matrix', 'Build technique→detection map', 'Identify coverage gaps'],
            frameworks: ['MITRE ATT&CK v14', 'D3FEND'],
            links: [
              reference(REF.BLUE_TEAM, 'Threat detection playbook'),
              external('https://attack.mitre.org/', 'MITRE ATT&CK home'),
              external('https://d3fend.mitre.org/', 'MITRE D3FEND')
            ]
          }),
          topic('soc-13-malware', 'Malware triage & static analysis', 'Initial sample analysis without full reverse engineering.', {
            week: 5, hours: 4,
            objectives: ['Calculate file hashes', 'Extract strings and metadata', 'Submit to sandbox safely'],
            frameworks: ['SANS FOR610 intro', 'MITRE T1204'],
            links: [
              reference(REF.MALWARE, 'Malware analysis introduction'),
              { type: 'virustotal', label: 'VirusTotal analysis', path: '/virustotal' },
              challenge(CHALLENGES.STEGO, 'forensics')
            ]
          }),
          topic('soc-14-behavior', 'Behavioral analytics & UEBA concepts', 'Baseline normal activity and detect anomalies.', {
            week: 5, hours: 4,
            objectives: ['Define behavioral baselines', 'Spot lateral movement indicators', 'Identify C2 beaconing'],
            frameworks: ['MITRE T1021', 'MITRE T1570'],
            links: [
              { type: 'soc', label: 'SOC Assistant scenarios', path: '/soc' },
              lab(LABS.NETWORK),
              external('https://attack.mitre.org/tactics/TA0008/', 'MITRE Lateral Movement')
            ]
          }),
          topic('soc-15-linux-detect', 'Linux threat detection', 'Auth logs, cron persistence, and privesc indicators on Linux hosts.', {
            week: 6, hours: 4,
            objectives: ['Parse auth.log for SSH abuse', 'Detect cron persistence', 'Identify SUID anomalies'],
            frameworks: ['MITRE T1053.003', 'MITRE T1548.001'],
            links: [
              lab(LABS.CRON),
              challenge(CHALLENGES.LINUX_PRIVESC, 'linux'),
              exam(EXAMS.LINUX, 'Linux Security Exam')
            ]
          })
        ]
      },
      {
        id: 'soc-ir',
        title: 'Phase 4: Incident Response',
        description: 'NIST IR lifecycle — preparation through post-incident improvement.',
        order: 4,
        topics: [
          topic('soc-16-ir-lifecycle', 'NIST incident response lifecycle', 'Preparation, detection, containment, eradication, recovery, lessons learned.', {
            week: 6, hours: 3,
            objectives: ['Name all NIST IR phases', 'Map SOC playbooks to phases', 'Define severity classifications'],
            frameworks: ['NIST SP 800-61r2', 'SANS IR process'],
            links: [
              reference(REF.IR, 'Incident response lifecycle'),
              reference(REF.GOVERNANCE, 'NIST & ISO frameworks'),
              external('https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final', 'NIST SP 800-61r2')
            ]
          }),
          topic('soc-17-containment', 'Containment & eradication', 'Isolate hosts, remove persistence, and validate cleanup.', {
            week: 6, hours: 4,
            objectives: ['Execute safe isolation steps', 'Remove persistence mechanisms', 'Validate eradication'],
            frameworks: ['NIST IR Containment', 'MITRE T1070'],
            links: [
              reference(REF.IR, 'Containment strategies'),
              { type: 'soc', label: 'SOC Assistant IR scenarios', path: '/soc' },
              external('https://www.sans.org/white-papers/incident-handlers-handbook/', 'SANS Incident Handlers Handbook')
            ]
          }),
          topic('soc-18-ir-exam', 'Incident response knowledge check', 'Validate IR concepts with the dedicated practice exam.', {
            week: 6, hours: 3,
            objectives: ['Pass Incident Response Exam (70%+)', 'Review missed topics', 'Update personal IR playbook'],
            frameworks: ['CompTIA CySA+ IR domain', 'BTL1 IR'],
            links: [
              exam(EXAMS.IR, 'Incident Response Exam'),
              reference(REF.IR, 'IR reference'),
              { type: 'exams', label: 'All practice exams', path: '/exams' }
            ]
          }),
          topic('soc-19-reporting', 'Post-incident reporting & lessons learned', 'Timelines, root cause, and detection improvement recommendations.', {
            week: 6, hours: 4,
            objectives: ['Build incident timeline', 'Write root cause analysis', 'Propose detection improvements'],
            frameworks: ['NIST IR Post-Incident', 'ISO 27035'],
            links: [
              { type: 'notes', label: 'Write incident report draft', path: '/notes' },
              reference(REF.GOVERNANCE, 'Governance & compliance'),
              reference(REF.SOC_ROLE, 'SOC analyst career path')
            ]
          }),
          topic('soc-20-certs', 'SOC certification & career next steps', 'CySA+, BTL1, GCIA paths and platform certificates.', {
            week: 6, hours: 2,
            objectives: ['Review earned certificates', 'Choose blue team cert path', 'Plan continuous threat hunting practice'],
            frameworks: ['CompTIA CySA+', 'BTL1', 'GCIA'],
            links: [
              reference(REF.CERTS, 'Certifications roadmap'),
              { type: 'certificates', label: 'View your certificates', path: '/certificates' },
              external('https://www.comptia.org/certifications/cybersecurity-analyst', 'CompTIA CySA+')
            ]
          })
        ]
      }
    ]
  },
  {
    slug: 'forensics-analyst',
    title: 'Digital Forensics Plan',
    subtitle: 'DFIR path — evidence, artifacts, timelines, and expert reporting',
    description: 'Hands-on digital forensics and incident response track aligned with SANS FOR500/508 concepts and NIST evidence handling. Covers disk artifacts, steganography, encoding chains, network forensics, and timeline construction using CyberLab challenges and labs.',
    career: 'forensics',
    duration: '5 weeks',
    durationDays: 35,
    icon: '🔍',
    color: '#d29922',
    featured: true,
    order: 3,
    outcomes: [
      'Preserve evidence integrity and chain of custody',
      'Analyze file system and metadata artifacts',
      'Extract hidden data via steganography and encoding techniques',
      'Perform network forensics on PCAP artifacts',
      'Build investigative timelines and write expert-ready reports'
    ],
    phases: [
      {
        id: 'for-foundations',
        title: 'Phase 1: DFIR Foundations',
        description: 'Evidence handling, legal considerations, and forensic methodology.',
        order: 1,
        topics: [
          topic('for-01-role', 'DFIR role & investigative mindset', 'How forensic investigators differ from pentesters and SOC analysts.', {
            week: 1, hours: 3,
            objectives: ['Define DFIR scope', 'Understand legal admissibility basics', 'Follow forensic ethics'],
            frameworks: ['SANS DFIR', 'NIST SP 800-86'],
            links: [
              reference(REF.FORENSICS_ROLE, 'Digital forensics investigator role'),
              reference(REF.DFIR, 'Digital forensics fundamentals'),
              reference(REF.LEGAL, 'Legal & ethical framework')
            ]
          }),
          topic('for-02-chain', 'Chain of custody & evidence integrity', 'Hashing, write blockers, and documentation standards.', {
            week: 1, hours: 3,
            objectives: ['Document chain of custody', 'Verify hashes before/after analysis', 'Avoid evidence contamination'],
            frameworks: ['NIST SP 800-86', 'ISO 27037'],
            links: [
              reference(REF.DFIR, 'Evidence handling'),
              reference(REF.GOVERNANCE, 'Governance frameworks'),
              external('https://www.nist.gov/publications/guide-integrating-forensic-techniques-incident-response', 'NIST SP 800-86')
            ]
          }),
          topic('for-03-artifacts', 'File system artifacts', 'MFT, inodes, browser history, registry hives, and deleted file recovery concepts.', {
            week: 1, hours: 4,
            objectives: ['Identify key OS artifacts', 'Understand MAC times', 'Locate user activity traces'],
            frameworks: ['SANS FOR500', 'MITRE T1070.004'],
            links: [
              reference(REF.DFIR, 'Filesystem artifact guide'),
              reference(REF.TOOLS, 'Forensics tools'),
              external('https://www.sans.org/posters/windows-forensic-analysis/', 'SANS Windows Forensic Analysis poster')
            ]
          }),
          topic('for-04-metadata', 'Metadata & file triage', 'EXIF, strings, file headers — first steps on unknown artifacts.', {
            week: 2, hours: 3,
            objectives: ['Run exiftool and strings safely', 'Identify file type from magic bytes', 'Document triage steps'],
            frameworks: ['SANS FOR508 triage', 'NIST IR evidence collection'],
            links: [
              challenge(CHALLENGES.STEGO, 'forensics'),
              reference(REF.TOOLS, 'Essential forensics tools'),
              reference(REF.MALWARE, 'Malware triage overlap')
            ]
          })
        ]
      },
      {
        id: 'for-artifacts',
        title: 'Phase 2: Hidden Data & Encoding',
        description: 'Steganography, encoding chains, and hash verification — core CTF and DFIR skills.',
        order: 2,
        topics: [
          topic('for-05-stego', 'Steganography analysis', 'Extract hidden messages from images and documents.', {
            week: 2, hours: 4,
            objectives: ['Use strings and exiftool', 'Apply steghide/binwalk concepts', 'Solve steganography challenge'],
            frameworks: ['CISA Steganography advisory', 'MITRE T1027'],
            links: [
              challenge(CHALLENGES.STEGO, 'forensics'),
              reference(REF.DFIR, 'Steganography in DFIR'),
              external('https://attack.mitre.org/techniques/T1027/', 'MITRE T1027 — Obfuscated Files')
            ]
          }),
          topic('for-06-encoding', 'Encoding chains & data carving', 'Peel Base64, hex, and layered encodings to recover secrets.', {
            week: 2, hours: 3,
            objectives: ['Decode multi-layer Base64', 'Use CyberChef-style workflows', 'Solve Base64 Secrets challenge'],
            frameworks: ['CWE-327', 'RFC 4648'],
            links: [
              challenge(CHALLENGES.BASE64, 'forensics'),
              reference(REF.CRYPTO, 'Encoding vs encryption'),
              reference(REF.TOOLS, 'CyberChef & CLI decode tools')
            ]
          }),
          topic('for-07-hashing', 'Hash verification & password artifacts', 'Verify integrity and crack weak hashes in controlled environments.', {
            week: 3, hours: 4,
            objectives: ['Compare before/after hashes', 'Identify MD5/SHA family', 'Complete hash cracking lab'],
            frameworks: ['NIST FIPS 180-4', 'OWASP password storage'],
            links: [
              lab(LABS.HASH),
              reference(REF.CRYPTO, 'Hashing fundamentals'),
              external('https://csrc.nist.gov/projects/hash-functions', 'NIST hash functions')
            ]
          }),
          topic('for-08-tools', 'Forensics toolchain mastery', 'Build a repeatable triage toolkit: strings, exiftool, binwalk, volatility concepts.', {
            week: 3, hours: 3,
            objectives: ['Document tool selection rationale', 'Run non-destructive triage', 'Preserve original evidence'],
            frameworks: ['SANS FOR500 tool list'],
            links: [
              reference(REF.TOOLS, 'Essential security tools'),
              reference(REF.DFIR, 'DFIR methodology'),
              external('https://www.volatilityfoundation.org/', 'Volatility memory forensics')
            ]
          })
        ]
      },
      {
        id: 'for-network',
        title: 'Phase 3: Network & Memory Forensics',
        description: 'PCAP analysis, network artifacts in investigations, and memory forensics introduction.',
        order: 3,
        topics: [
          topic('for-09-pcap', 'Network forensics & PCAP analysis', 'Reconstruct sessions and extract indicators from packet captures.', {
            week: 3, hours: 5,
            objectives: ['Filter PCAP for HTTP/DNS', 'Extract credentials from plaintext', 'Complete network lab'],
            frameworks: ['MITRE T1040', 'Wireshark analysis'],
            links: [
              challenge(CHALLENGES.PCAP, 'network'),
              lab(LABS.NETWORK),
              reference(REF.NETWORK_PENTEST, 'Network traffic analysis')
            ]
          }),
          topic('for-10-memory', 'Memory forensics introduction', 'Processes, DLLs, network connections, and injection indicators in RAM.', {
            week: 4, hours: 4,
            objectives: ['List processes from memory dump concepts', 'Identify injection indicators', 'Correlate memory with disk evidence'],
            frameworks: ['SANS FOR508', 'MITRE T1055'],
            links: [
              reference(REF.DFIR, 'Memory forensics overview'),
              reference(REF.MALWARE, 'Malware in memory'),
              external('https://attack.mitre.org/techniques/T1055/', 'MITRE T1055 — Process Injection')
            ]
          }),
          topic('for-11-creds', 'Credential artifacts & secrets', 'Recover and handle sensitive data per policy during investigations.', {
            week: 4, hours: 3,
            objectives: ['Locate credential stores', 'Handle secrets per policy', 'Document extraction method'],
            frameworks: ['NIST SP 800-63B', 'MITRE T1555'],
            links: [
              lab(LABS.HASH),
              challenge(CHALLENGES.BASE64, 'forensics'),
              reference(REF.CRYPTO, 'Secrets management')
            ]
          }),
          topic('for-12-malware', 'Malware artifacts in DFIR', 'Bridge DFIR and malware analysis — IOCs, sandboxes, and family identification.', {
            week: 4, hours: 4,
            objectives: ['Extract IOCs from samples', 'Use sandbox reports safely', 'Map malware to ATT&CK'],
            frameworks: ['MITRE ATT&CK for malware', 'SANS FOR610'],
            links: [
              reference(REF.MALWARE, 'Malware analysis intro'),
              { type: 'virustotal', label: 'VirusTotal sandbox', path: '/virustotal' },
              challenge(CHALLENGES.STEGO, 'forensics')
            ]
          })
        ]
      },
      {
        id: 'for-timeline',
        title: 'Phase 4: Timelines & Reporting',
        description: 'Super timeline construction and expert forensic reporting.',
        order: 4,
        topics: [
          topic('for-13-time', 'Timestamp normalization', 'Unify UTC, local time, and epoch formats across heterogeneous sources.', {
            week: 5, hours: 3,
            objectives: ['Normalize all times to UTC', 'Resolve timezone conflicts', 'Account for clock skew'],
            frameworks: ['SANS FOR508 timeline', 'Plaso/log2timeline concepts'],
            links: [
              { type: 'notes', label: 'Build timeline worksheet', path: '/notes' },
              reference(REF.DFIR, 'Timeline analysis'),
              external('https://plaso.readthedocs.io/', 'Plaso super timeline tool')
            ]
          }),
          topic('for-14-super', 'Super timeline & correlation', 'Merge disk, network, memory, and log events into one narrative.', {
            week: 5, hours: 5,
            objectives: ['Correlate multi-source events', 'Identify attack sequence', 'Highlight pivot points'],
            frameworks: ['SANS FOR508', 'NIST IR analysis'],
            links: [
              challenge(CHALLENGES.PCAP, 'network'),
              challenge(CHALLENGES.STEGO, 'forensics'),
              challenge(CHALLENGES.BASE64, 'forensics'),
              labs('Forensics & network labs', null)
            ]
          }),
          topic('for-15-report', 'Forensic reporting & expert testimony prep', 'Chain of custody, findings, conclusions, and certificate milestones.', {
            week: 5, hours: 4,
            objectives: ['Write expert-ready report', 'Maintain chain of custody docs', 'Review certification options'],
            frameworks: ['NIST IR reporting', 'FRE 702 (US expert testimony)', 'GCFE/GCFA paths'],
            links: [
              reference(REF.FORENSICS_ROLE, 'Forensics career path'),
              reference(REF.CERTS, 'Forensics certifications'),
              { type: 'certificates', label: 'View your certificates', path: '/certificates' },
              { type: 'roadmap', label: 'Forensics learning path', path: '/roadmap' }
            ]
          })
        ]
      }
    ]
  }
];

module.exports = { STUDY_PLANS };
