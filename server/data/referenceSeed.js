/** Curated cybersecurity reference content for CyberLab */

const L = (label, url, type = 'website') => ({ label, url, type });
const S = (title, content, bullets = [], links = []) => ({ title, content, bullets, links });
const T = (name, description, url, category = 'general') => ({ name, description, url, category });

const articles = [
  {
    slug: 'cybersecurity-roles-overview',
    title: 'Cybersecurity Roles & Career Paths',
    summary: 'Overview of major cybersecurity job roles — responsibilities, skills, tools, and how ethical hacking, pentesting, forensics, and blue team paths differ.',
    icon: '👔',
    category: 'roles',
    subcategory: 'Career Guide',
    difficulty: 'beginner',
    readingMinutes: 12,
    tags: ['careers', 'roles', 'SOC', 'pentest', 'forensics', 'GRC'],
    featured: true,
    order: 1,
    relatedSlugs: ['ethical-hacker-role', 'penetration-tester-role', 'digital-forensics-investigator', 'soc-analyst-role'],
    sections: [
      S('The cybersecurity landscape', 'Cybersecurity is not one job — it is a ecosystem of specialized roles defending systems, finding weaknesses, investigating incidents, and governing risk. Organizations need people who think like attackers (offensive), defenders (defensive), investigators (forensics), and strategists (GRC). Many professionals rotate between these paths over a career.'),
      S('Offensive security roles', 'These roles legally simulate attackers to find and fix weaknesses before criminals exploit them.', [
        'Ethical Hacker / White-hat hacker — broad offensive skills, bug bounty, advisories',
        'Penetration Tester — scoped engagements, formal reports, PTES/OWASP methodology',
        'Red Team Operator — adversary simulation, stealth, physical/social layers',
        'Application Security Engineer — SDLC integration, code review, SAST/DAST',
        'Exploit Developer / Vulnerability Researcher — deep reverse engineering, CVE discovery'
      ], [
        L('MITRE ATT&CK', 'https://attack.mitre.org/', 'standard'),
        L('OWASP', 'https://owasp.org/', 'standard')
      ]),
      S('Defensive & operations roles', 'Blue team and SOC roles detect, contain, and eradicate threats in live environments.', [
        'SOC Analyst (Tier 1–3) — alert triage, log analysis, escalation',
        'Threat Hunter — proactive hypothesis-driven searches in data',
        'Incident Responder / DFIR — containment, eradication, recovery',
        'Security Engineer — firewalls, EDR, SIEM, hardening, automation',
        'Malware Analyst — static/dynamic analysis, IOC extraction'
      ]),
      S('Investigation & forensics roles', 'Forensic professionals preserve evidence and reconstruct events for legal or internal proceedings.', [
        'Digital Forensics Investigator — disk, memory, mobile, cloud artifacts',
        'eDiscovery Specialist — legal holds, chain of custody, litigation support',
        'Fraud Examiner — financial crime, insider threat evidence'
      ]),
      S('Governance, risk & compliance (GRC)', 'GRC roles align security with business risk, regulations, and audits.', [
        'Security Analyst (GRC) — policies, risk registers, control mapping',
        'Compliance Officer — GDPR, HIPAA, PCI-DSS, SOC 2',
        'CISO / Security Manager — strategy, budget, metrics, board reporting',
        'Privacy Officer / DPO — data protection impact assessments'
      ]),
      S('Skills that transfer across roles', 'Regardless of specialty, strong practitioners share foundational competencies.', [
        'Networking (TCP/IP, DNS, HTTP, TLS, routing)',
        'Operating systems (Linux & Windows internals)',
        'Scripting (Python, Bash, PowerShell)',
        'Cloud fundamentals (IAM, logging, shared responsibility)',
        'Communication — reports, stakeholder briefings, documentation',
        'Continuous learning — threats evolve weekly'
      ])
    ]
  },
  {
    slug: 'ethical-hacker-role',
    title: 'Ethical Hacker — Role, Skills & Path',
    summary: 'What ethical hackers do, legal boundaries, bug bounty vs employment, core skills, certifications, and recommended learning path.',
    icon: '🎯',
    category: 'roles',
    difficulty: 'beginner',
    readingMinutes: 10,
    tags: ['ethical hacking', 'CEH', 'bug bounty', 'offensive'],
    order: 2,
    relatedSlugs: ['ethical-hacking-fundamentals', 'legal-ethical-framework', 'learning-platforms-resources'],
    sections: [
      S('What is an ethical hacker?', 'An ethical hacker uses the same techniques as malicious actors — scanning, exploitation, privilege escalation, social engineering — but with explicit written authorization and defined scope. The goal is to improve security, not to cause harm or access data beyond what the engagement allows.'),
      S('Legal & ethical requirements', 'Unauthorized testing is illegal in most jurisdictions. Always obtain written permission (Rules of Engagement, scope document) before testing any system you do not own.', [
        'Signed authorization / contract before any test',
        'Defined scope: IPs, domains, apps, time windows',
        'Data handling rules — often no real PII exfiltration',
        'Responsible disclosure for vulnerabilities found outside engagements',
        'Know local laws (CFAA in US, Computer Misuse Act UK, etc.)'
      ], [L('EC-Council Code of Ethics', 'https://www.eccouncil.org/code-of-ethics/', 'standard')]),
      S('Core technical skills', '', [
        'Reconnaissance & OSINT',
        'Network scanning (Nmap, Masscan)',
        'Web app testing (Burp Suite, OWASP Top 10)',
        'Password attacks & credential hygiene awareness',
        'Linux & Windows command line fluency',
        'Basic scripting for automation',
        'Report writing with reproducible steps'
      ]),
      S('Bug bounty vs full-time ethical hacking', 'Bug bounty platforms reward individual findings on in-scope programs. Full-time roles include pentesting firms, internal red teams, and product security. Many hackers start with CTFs and bounties, then move to structured engagements.')
    ],
    tools: [
      T('Burp Suite', 'Web proxy and scanner for HTTP testing', 'https://portswigger.net/burp', 'web'),
      T('Nmap', 'Network discovery and port scanning', 'https://nmap.org/', 'network'),
      T('Kali Linux', 'Pre-installed offensive security distro', 'https://www.kali.org/', 'platform')
    ]
  },
  {
    slug: 'penetration-tester-role',
    title: 'Penetration Tester — Role & Methodology',
    summary: 'Penetration testing engagements, PTES phases, deliverables, specializations (web, network, cloud, AD), and tools of the trade.',
    icon: '🔓',
    category: 'roles',
    difficulty: 'intermediate',
    readingMinutes: 11,
    tags: ['pentest', 'PTES', 'red team', 'reporting'],
    order: 3,
    relatedSlugs: ['penetration-testing-methodology', 'web-application-pentesting', 'network-pentesting'],
    sections: [
      S('Role definition', 'Penetration testers conduct time-boxed, scoped security assessments simulating real-world attacks. Deliverables include executive summaries, technical findings with CVSS-style severity, proof-of-concept evidence, and remediation guidance.'),
      S('Engagement types', '', [
        'Black-box — no prior internal knowledge',
        'Grey-box — partial credentials or architecture docs',
        'White-box — full source, architecture, credentials',
        'External vs internal network assessments',
        'Web application / API / mobile / cloud / Active Directory'
      ]),
      S('Standard methodology (PTES)', 'The Penetration Testing Execution Standard defines seven phases: Pre-engagement, Intelligence Gathering, Threat Modeling, Vulnerability Analysis, Exploitation, Post-Exploitation, Reporting.', [], [L('PTES', 'http://www.pentest-standard.org/', 'standard')]),
      S('What clients expect', '', [
        'Clear scope boundaries respected at all times',
        'Minimal business disruption; safe PoC exploits',
        'Actionable remediation — not just tool output dumps',
        'Retest validation after fixes (optional phase)',
        'Confidentiality of all findings'
      ])
    ]
  },
  {
    slug: 'digital-forensics-investigator',
    title: 'Digital Forensics Investigator',
    summary: 'DFIR role overview — evidence handling, disk/memory/mobile forensics, chain of custody, and tooling for investigations.',
    icon: '🔍',
    category: 'roles',
    difficulty: 'intermediate',
    readingMinutes: 12,
    tags: ['forensics', 'DFIR', 'evidence', 'investigation'],
    order: 4,
    relatedSlugs: ['digital-forensics-fundamentals', 'incident-response-lifecycle', 'essential-security-tools'],
    sections: [
      S('Mission of digital forensics', 'Forensics investigators collect, preserve, analyze, and present digital evidence in a manner that is legally defensible. Integrity of evidence is paramount — one mishandled copy can invalidate an entire case.'),
      S('Chain of custody', 'Every transfer of evidence must be documented: who collected it, when, hash values, storage location, and who accessed it. Write-blockers are used for storage media to prevent accidental modification.', [
        'Document date/time, handler, purpose of access',
        'Cryptographic hashes (SHA-256) before and after imaging',
        'Forensic images — bit-for-bit copies, not live file copies',
        'Maintain original evidence sealed when possible'
      ]),
      S('Forensic domains', '', [
        'Host forensics — filesystem timelines, registry, logs, browser artifacts',
        'Memory forensics — running processes, network connections, injected code',
        'Network forensics — PCAP analysis, NetFlow, firewall logs',
        'Mobile forensics — iOS/Android backups, app data, location artifacts',
        'Cloud forensics — API logs, IAM trails, SaaS audit logs'
      ]),
      S('Common artifacts investigators seek', '', [
        'File system MAC times (Modified, Accessed, Changed, Born)',
        'Prefetch, Shimcache, Amcache on Windows',
        'Shellbags, LNK files, Jump Lists',
        'Email headers, PST/OST stores',
        'Malware persistence mechanisms (services, scheduled tasks, registry run keys)'
      ])
    ],
    tools: [
      T('Autopsy', 'GUI digital forensics platform', 'https://www.autopsy.com/', 'forensics'),
      T('Volatility', 'Memory forensics framework', 'https://volatilityfoundation.org/', 'forensics'),
      T('FTK Imager', 'Disk imaging and preview', 'https://www.exterro.com/ftk-imager', 'forensics'),
      T('Wireshark', 'Network packet analysis', 'https://www.wireshark.org/', 'network')
    ]
  },
  {
    slug: 'soc-analyst-role',
    title: 'SOC Analyst — Blue Team Operations',
    summary: 'Security Operations Center tiers, SIEM workflows, alert triage, escalation, and skills needed for defensive monitoring.',
    icon: '🛡️',
    category: 'roles',
    difficulty: 'beginner',
    readingMinutes: 9,
    tags: ['SOC', 'blue team', 'SIEM', 'monitoring'],
    order: 5,
    relatedSlugs: ['incident-response-lifecycle', 'blue-team-fundamentals', 'essential-security-tools'],
    sections: [
      S('What is a SOC?', 'A Security Operations Center is a team and function that continuously monitors an organization\'s IT environment for signs of compromise, policy violations, and misconfigurations. SOC analysts are the front line of detection.'),
      S('Tier structure', '', [
        'Tier 1 — Alert triage, false positive reduction, playbook execution',
        'Tier 2 — Deep investigation, correlation, containment recommendations',
        'Tier 3 / Threat Hunter — Proactive hunting, malware reverse engineering',
        'SOC Manager — metrics, staffing, tool roadmap, incident command'
      ]),
      S('Daily workflows', '', [
        'Review SIEM dashboards and queued alerts',
        'Enrich IOCs (IPs, hashes, domains) with threat intel',
        'Tune detection rules to reduce noise',
        'Document incidents in ticketing/IR platforms',
        'Coordinate with IT for containment actions'
      ]),
      S('Key knowledge areas', '', [
        'Log sources: Windows Event ID, Sysmon, EDR, firewall, proxy, DNS',
        'MITRE ATT&CK mapping for alerts',
        'Phishing analysis and email header inspection',
        'Basic malware indicators without full RE',
        'Incident severity classification'
      ])
    ]
  },
  {
    slug: 'ethical-hacking-fundamentals',
    title: 'Ethical Hacking Fundamentals',
    summary: 'Core concepts every ethical hacker must master — recon, scanning, exploitation basics, post-exploitation awareness, and reporting.',
    icon: '🎯',
    category: 'ethical-hacking',
    difficulty: 'beginner',
    readingMinutes: 14,
    featured: true,
    order: 1,
    tags: ['ethical hacking', 'recon', 'exploitation', 'methodology'],
    relatedSlugs: ['legal-ethical-framework', 'penetration-testing-methodology', 'osint-investigations'],
    sections: [
      S('The ethical hacking mindset', 'Think like an attacker, act like a professional. Curiosity drives discovery; discipline ensures you stay legal, scoped, and constructive. Every finding should answer: what is broken, how was it proven, and how should it be fixed?'),
      S('Phases of an offensive assessment', '', [
        '1. Reconnaissance — passive & active information gathering',
        '2. Scanning — ports, services, versions, web directories',
        '3. Enumeration — users, shares, APIs, subdomains, tech stack',
        '4. Vulnerability identification — manual + automated',
        '5. Exploitation — prove impact with minimal harm',
        '6. Post-exploitation — privilege, lateral movement (if in scope)',
        '7. Reporting — evidence, risk rating, remediation'
      ]),
      S('Reconnaissance depth', 'Passive recon uses public data (DNS, certificates, social media, breach databases) without touching the target directly. Active recon includes port scans and service probes — only with authorization.', [], [
        L('OSINT Framework', 'https://osintframework.com/', 'website'),
        L('Shodan', 'https://www.shodan.io/', 'tool')
      ]),
      S('Common vulnerability classes', '', [
        'Injection (SQL, command, LDAP)',
        'Broken authentication & session management',
        'Sensitive data exposure',
        'Misconfigurations (S3 buckets, default creds)',
        'Missing patches & known CVEs',
        'Weak cryptography'
      ], [L('OWASP Top 10', 'https://owasp.org/www-project-top-ten/', 'standard')]),
      S('Professional reporting', 'Reports must be reproducible. Include screenshots, commands, timestamps, affected assets, business impact, and clear remediation steps prioritized by risk.')
    ]
  },
  {
    slug: 'penetration-testing-methodology',
    title: 'Penetration Testing Methodology',
    summary: 'PTES, OWASP Testing Guide, test planning, threat modeling, exploitation discipline, and quality reporting standards.',
    icon: '🔓',
    category: 'pentesting',
    difficulty: 'intermediate',
    readingMinutes: 13,
    featured: true,
    order: 1,
    tags: ['PTES', 'OWASP', 'methodology', 'pentest'],
    relatedSlugs: ['web-application-pentesting', 'network-pentesting', 'penetration-tester-role'],
    sections: [
      S('Why methodology matters', 'Structured methodology ensures completeness, comparability across engagements, and defensible results. Ad-hoc testing misses attack paths; methodology forces consideration of each threat surface.'),
      S('Pre-engagement', '', [
        'Define objectives and success criteria',
        'Rules of Engagement (RoE) — allowed techniques, hours, contacts',
        'Emergency stop procedures',
        'Legal agreements and insurance',
        'Environment diagram and asset inventory'
      ]),
      S('Intelligence gathering', 'Map the attack surface: domains, IP ranges, employees, tech stack (Wappalyzer, BuiltWith), leaked credentials (haveibeenpwned — only for authorized assessments).'),
      S('Vulnerability analysis', 'Combine automated scanners with manual validation. Scanners produce false positives; a pentester proves exploitability or documents why risk is theoretical.'),
      S('Exploitation & post-exploitation', 'Use the least destructive PoC that demonstrates impact. Document privilege obtained, data accessible, and lateral paths — only within scope.', [], [
        L('OWASP Testing Guide', 'https://owasp.org/www-project-web-security-testing-guide/', 'standard'),
        L('NIST SP 800-115', 'https://csrc.nist.gov/publications/detail/sp/800-115/final', 'standard')
      ]),
      S('Reporting structure', '', [
        'Executive summary for leadership (risk in business terms)',
        'Scope and methodology',
        'Findings table: ID, severity, asset, status',
        'Technical detail per finding with remediation',
        'Appendices: tools, raw evidence references'
      ])
    ]
  },
  {
    slug: 'web-application-pentesting',
    title: 'Web Application Penetration Testing',
    summary: 'Testing modern web apps and APIs — authentication, injection, XSS, CSRF, SSRF, business logic, and secure SDLC integration.',
    icon: '🌐',
    category: 'pentesting',
    difficulty: 'intermediate',
    readingMinutes: 15,
    order: 2,
    tags: ['web', 'OWASP', 'API', 'Burp', 'XSS', 'SQLi'],
    relatedSlugs: ['penetration-testing-methodology', 'programming-libraries-security'],
    sections: [
      S('Scope of web testing', 'Web assessments cover the application layer: HTTP/HTTPS, REST/GraphQL APIs, authentication flows, session cookies, file uploads, and client-side JavaScript. Mobile apps often share the same backend APIs.'),
      S('Essential test areas', '', [
        'Authentication — brute force protections, MFA bypass, password reset flaws',
        'Authorization / IDOR — horizontal & vertical privilege escalation',
        'Input validation — SQLi, XSS, command injection, template injection',
        'Session management — fixation, timeout, cookie flags (HttpOnly, Secure, SameSite)',
        'Business logic — race conditions, coupon abuse, workflow skips',
        'API security — excessive data exposure, mass assignment, rate limits',
        'Security headers — CSP, HSTS, X-Frame-Options'
      ]),
      S('Tooling workflow', 'Proxy all traffic through Burp Suite or OWASP ZAP. Use Repeater for manual tests, Intruder for fuzzing (carefully in prod), and Collaborator for out-of-band detection.', [], [
        L('PortSwigger Web Security Academy', 'https://portswigger.net/web-security', 'course'),
        L('OWASP WSTG', 'https://owasp.org/www-project-web-security-testing-guide/', 'standard')
      ]),
      S('API-specific checks', '', [
        'Schema validation bypass',
        'Broken object level authorization (BOLA)',
        'JWT alg:none / weak signing keys',
        'GraphQL introspection and batching abuse',
        'WebSocket message tampering'
      ])
    ],
    tools: [
      T('Burp Suite', 'Industry-standard web proxy', 'https://portswigger.net/burp', 'web'),
      T('OWASP ZAP', 'Open-source web scanner', 'https://www.zaproxy.org/', 'web'),
      T('sqlmap', 'Automated SQL injection tool', 'https://sqlmap.org/', 'web')
    ]
  },
  {
    slug: 'network-pentesting',
    title: 'Network Penetration Testing',
    summary: 'External and internal network assessments — scanning, service exploitation, Active Directory attacks, and pivoting.',
    icon: '📡',
    category: 'pentesting',
    difficulty: 'intermediate',
    readingMinutes: 14,
    order: 3,
    tags: ['network', 'Active Directory', 'Nmap', 'lateral movement'],
    relatedSlugs: ['penetration-testing-methodology', 'essential-security-tools'],
    sections: [
      S('Network test objectives', 'Identify reachable services, misconfigurations, patch gaps, and paths to domain compromise. Internal tests often simulate an attacker with LAN access or stolen VPN credentials.'),
      S('Discovery phase', '', [
        'Host discovery — ICMP, ARP, TCP SYN',
        'Port scanning — service version detection (-sV)',
        'UDP services — DNS, SNMP, TFTP often overlooked',
        'Vulnerability scanning — Nessus, OpenVAS (validate manually)',
        'Network mapping — traceroute, routing, VLAN hopping (if in scope)'
      ]),
      S('Active Directory attack paths', 'AD environments introduce Kerberos, LDAP, and Group Policy attack surfaces.', [
        'Password spraying & credential stuffing',
        'Kerberoasting / AS-REP roasting',
        'LLMNR/NBT-NS poisoning (Responder)',
        'BloodHound path analysis to Domain Admin',
        'Golden/Silver ticket concepts (advanced)',
        'GPO abuse and delegation misconfigurations'
      ], [L('BloodHound', 'https://bloodhound.readthedocs.io/', 'tool')]),
      S('Pivoting & tunneling', 'After foothold, use SSH tunnels, Chisel, Ligolo, or proxychains to reach segmented networks. Document every pivot in the report.')
    ],
    tools: [
      T('Nmap', 'Network scanner', 'https://nmap.org/', 'network'),
      T('CrackMapExec', 'AD/SMB swiss army knife', 'https://github.com/Porchetta-Industries/CrackMapExec', 'network'),
      T('Responder', 'LLMNR/NBT-NS poisoner', 'https://github.com/lgandx/Responder', 'network')
    ]
  },
  {
    slug: 'digital-forensics-fundamentals',
    title: 'Digital Forensics Fundamentals',
    summary: 'Evidence types, forensic imaging, timeline analysis, memory forensics intro, and investigation documentation.',
    icon: '🔬',
    category: 'forensics',
    difficulty: 'intermediate',
    readingMinutes: 16,
    featured: true,
    order: 1,
    tags: ['forensics', 'evidence', 'timeline', 'memory', 'disk'],
    relatedSlugs: ['digital-forensics-investigator', 'incident-response-lifecycle', 'osint-investigations'],
    sections: [
      S('Forensic principles', 'Forensics follows Locard\'s exchange principle — every contact leaves a trace. Investigators work to identify, preserve, analyze, and report on those traces without altering them.'),
      S('Types of digital evidence', '', [
        'Volatile — RAM, routing tables, active connections (collect first)',
        'Non-volatile — disk images, USB, backups',
        'Network — PCAPs, firewall logs, NetFlow',
        'Application — databases, cloud audit trails, SaaS logs',
        'Human — witness statements correlating with logs'
      ]),
      S('Acquisition best practices', '', [
        'Order of volatility — memory before disk when possible',
        'Hardware write-blockers for direct attached storage',
        'Hash verification after imaging',
        'Document system time vs UTC, timezone, clock drift',
        'Photograph physical devices and serial numbers'
      ]),
      S('Timeline analysis', 'Super timelines merge filesystem MACB times, registry hives, event logs, browser history, and execution artifacts (Prefetch) to reconstruct user and attacker activity.'),
      S('Memory forensics intro', 'RAM contains encryption keys, running malware, injected DLLs, and command history not yet written to disk. Volatility 3 plugins extract processes, connections, and malicious injections.', [], [
        L('Volatility Foundation', 'https://volatilityfoundation.org/', 'website'),
        L('SANS DFIR Poster', 'https://www.sans.org/posters/', 'resource')
      ]),
      S('Documentation & reporting', 'Forensic reports state hypotheses, tools used, hash values, findings with confidence levels, and limitations. Avoid overstating certainty — use "consistent with" language when appropriate.')
    ]
  },
  {
    slug: 'incident-response-lifecycle',
    title: 'Incident Response Lifecycle',
    summary: 'NIST incident response phases — preparation, detection, containment, eradication, recovery, and lessons learned.',
    icon: '🚨',
    category: 'blue-team',
    difficulty: 'intermediate',
    readingMinutes: 12,
    featured: true,
    order: 1,
    tags: ['incident response', 'NIST', 'DFIR', 'SOC'],
    relatedSlugs: ['soc-analyst-role', 'digital-forensics-fundamentals', 'blue-team-fundamentals'],
    sections: [
      S('Why IR matters', 'Incidents are inevitable. Prepared organizations limit dwell time, data loss, and reputational damage. IR connects SOC detection with forensics, legal, PR, and executive decision-making.'),
      S('NIST SP 800-61 phases', '', [
        '1. Preparation — playbooks, contacts, tools, backups, insurance',
        '2. Detection & Analysis — alerts, user reports, threat intel',
        '3. Containment — short-term (isolate host) & long-term (segmentation)',
        '4. Eradication — remove malware, close accounts, patch root cause',
        '5. Recovery — restore services, monitor for re-compromise',
        '6. Post-incident — lessons learned, metrics, control improvements'
      ], [L('NIST SP 800-61', 'https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final', 'standard')]),
      S('Containment decision factors', '', [
        'Severity and spread of compromise',
        'Business criticality of affected systems',
        'Legal / regulatory notification requirements',
        'Need to preserve evidence vs stop active exfiltration',
        'Availability of clean backups'
      ]),
      S('Communication', 'IR teams coordinate with IT operations, legal counsel, HR (insider threats), and executives. Pre-drafted communication templates accelerate response under pressure.')
    ]
  },
  {
    slug: 'blue-team-fundamentals',
    title: 'Blue Team Fundamentals',
    summary: 'Defensive security basics — hardening, logging, detection engineering, threat intel, and purple team collaboration.',
    icon: '🛡️',
    category: 'blue-team',
    difficulty: 'beginner',
    readingMinutes: 11,
    order: 2,
    tags: ['blue team', 'defense', 'hardening', 'detection'],
    relatedSlugs: ['soc-analyst-role', 'incident-response-lifecycle', 'vulnerability-management'],
    sections: [
      S('Defense in depth', 'No single control stops all attacks. Layer preventive, detective, and corrective controls across people, process, and technology.', [
        'Perimeter — firewalls, WAF, email filtering',
        'Endpoint — EDR, patching, application control',
        'Identity — MFA, least privilege, PAM',
        'Data — encryption, DLP, backups',
        'Human — training, phishing simulations'
      ]),
      S('Logging & visibility', 'You cannot defend what you cannot see. Centralize logs in a SIEM. High-value sources: authentication, DNS, proxy, EDR telemetry, cloud audit logs.', [], [
        L('MITRE D3FEND', 'https://d3fend.mitre.org/', 'standard')
      ]),
      S('Detection engineering', 'Translate threat intelligence and ATT&CK techniques into SIEM rules, Sigma signatures, and EDR queries. Tune to balance detection vs alert fatigue.'),
      S('Purple teaming', 'Offensive and defensive teams collaborate — red executes TTPs, blue validates detection coverage. Closes gaps faster than isolated red team reports.')
    ]
  },
  {
    slug: 'legal-ethical-framework',
    title: 'Legal & Ethical Framework for Security Testing',
    summary: 'Authorization, laws, responsible disclosure, privacy, and professional ethics every security practitioner must understand.',
    icon: '⚖️',
    category: 'governance',
    difficulty: 'beginner',
    readingMinutes: 10,
    order: 1,
    tags: ['legal', 'ethics', 'compliance', 'disclosure'],
    relatedSlugs: ['ethical-hacker-role', 'ethical-hacking-fundamentals'],
    sections: [
      S('Authorization is non-negotiable', 'Testing systems without permission is criminal in most countries, regardless of intent. Verbal approval is insufficient — get written scope.'),
      S('Key legal concepts', '', [
        'Computer Fraud and Abuse Act (US) — unauthorized access',
        'GDPR / privacy laws — handling personal data during tests',
        'Safe harbor in bug bounty program policies',
        'Export controls on cryptography and exploit tools (know your jurisdiction)',
        'Evidence admissibility requirements in forensics'
      ]),
      S('Responsible disclosure', 'When you find a vulnerability outside a formal program: notify the vendor privately, allow reasonable remediation time (often 90 days), do not exploit production data, coordinate CVE publication if applicable.', [], [
        L('Google Project Zero policy', 'https://googleprojectzero.blogspot.com/', 'standard'),
        L('ISO/IEC 29147', 'https://www.iso.org/standard/45170.html', 'standard')
      ]),
      S('Professional ethics', '', [
        'Protect confidential client data',
        'Do not hide findings to simplify retests',
        'Report all material risks discovered in scope',
        'Avoid conflicts of interest',
        'Maintain competency through ongoing education'
      ])
    ]
  },
  {
    slug: 'security-fundamentals-cia',
    title: 'Security Fundamentals — CIA Triad & Beyond',
    summary: 'Confidentiality, integrity, availability, authentication, non-repudiation, and core security principles for beginners.',
    icon: '📖',
    category: 'fundamentals',
    difficulty: 'beginner',
    readingMinutes: 8,
    featured: true,
    order: 1,
    tags: ['CIA', 'basics', 'fundamentals', 'risk'],
    relatedSlugs: ['cryptography-fundamentals', 'vulnerability-management'],
    sections: [
      S('CIA triad', '', [
        'Confidentiality — only authorized parties access information',
        'Integrity — data is accurate and unaltered unauthorized',
        'Availability — systems and data accessible when needed'
      ]),
      S('Extended principles', '', [
        'Authentication — verifying identity',
        'Authorization — granting appropriate access',
        'Non-repudiation — proof of origin/action (digital signatures, audit logs)',
        'Accountability — actions traceable to individuals',
        'Privacy — controlling personal data use'
      ]),
      S('Risk = Threat × Vulnerability × Impact', 'Security programs prioritize reducing risk through controls. Not all risks require elimination — some are accepted, transferred (insurance), or mitigated to acceptable levels.', [], [
        L('NIST Cybersecurity Framework', 'https://www.nist.gov/cyberframework', 'standard')
      ]),
      S('Common threat actors', '', [
        'Nation-state APTs — espionage, disruption',
        'Cybercriminals — ransomware, fraud',
        'Hacktivists — ideological motivation',
        'Insiders — malicious or negligent employees',
        'Script kiddies — low skill, opportunistic'
      ])
    ]
  },
  {
    slug: 'cryptography-fundamentals',
    title: 'Cryptography Fundamentals for Security',
    summary: 'Symmetric vs asymmetric encryption, hashing, TLS, certificates, and common crypto mistakes in applications.',
    icon: '🔐',
    category: 'fundamentals',
    difficulty: 'intermediate',
    readingMinutes: 12,
    order: 2,
    tags: ['crypto', 'TLS', 'hashing', 'encryption'],
    relatedSlugs: ['security-fundamentals-cia', 'web-application-pentesting'],
    sections: [
      S('Why crypto matters', 'Cryptography protects confidentiality and integrity in transit and at rest. Misimplementation is worse than no crypto — it creates false confidence.'),
      S('Building blocks', '', [
        'Symmetric (AES, ChaCha20) — shared secret, fast bulk encryption',
        'Asymmetric (RSA, ECC) — key pairs for key exchange & signatures',
        'Hashing (SHA-256) — one-way fingerprints, not encryption',
        'Password hashing — bcrypt, scrypt, Argon2 with salt',
        'Digital signatures — prove authenticity and integrity'
      ]),
      S('TLS in practice', 'HTTPS uses TLS to encrypt HTTP. Understand cipher suites, certificate chains, HSTS, and common flaws (expired certs, weak protocols, hostname mismatch).', [], [
        L('SSL Labs Test', 'https://www.ssllabs.com/ssltest/', 'tool')
      ]),
      S('Common mistakes', '', [
        'Rolling your own crypto algorithms',
        'ECB mode for structured data',
        'MD5/SHA1 for security purposes',
        'Hardcoded keys in source code',
        'Insufficient entropy in random number generation'
      ])
    ]
  },
  {
    slug: 'vulnerability-management',
    title: 'Vulnerability Management',
    summary: 'Discovering, prioritizing, patching, and tracking vulnerabilities across assets — CVSS, risk-based prioritization, and VM programs.',
    icon: '📊',
    category: 'governance',
    difficulty: 'intermediate',
    readingMinutes: 10,
    order: 2,
    tags: ['vulnerability', 'CVSS', 'patching', 'risk'],
    relatedSlugs: ['blue-team-fundamentals', 'penetration-testing-methodology'],
    sections: [
      S('VM program goals', 'Continuously identify vulnerabilities, prioritize by real risk to the business, remediate within SLAs, and verify fixes.'),
      S('Discovery sources', '', [
        'Authenticated vulnerability scanners',
        'Asset inventory / CMDB',
        'Penetration test findings',
        'Bug bounty submissions',
        'Threat intel on actively exploited CVEs (CISA KEV)',
        'Software composition analysis (SCA) for dependencies'
      ], [L('CISA KEV Catalog', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', 'website')]),
      S('Prioritization beyond CVSS', 'CVSS scores lack business context. Factor in: exploit availability, asset criticality, exposure (internet-facing), compensating controls, and threat intel.', [], [
        L('FIRST EPSS', 'https://www.first.org/epss/', 'standard')
      ]),
      S('Remediation SLAs (example tiers)', '', [
        'Critical + exploitable — 48–72 hours',
        'High — 2 weeks',
        'Medium — 30 days',
        'Low — next maintenance window'
      ])
    ]
  },
  {
    slug: 'osint-investigations',
    title: 'OSINT for Security Investigations',
    summary: 'Open Source Intelligence techniques for recon, threat intel, fraud investigation, and attribution support.',
    icon: '🕵️',
    category: 'forensics',
    difficulty: 'intermediate',
    readingMinutes: 11,
    order: 2,
    tags: ['OSINT', 'recon', 'investigation', 'intel'],
    relatedSlugs: ['ethical-hacking-fundamentals', 'digital-forensics-fundamentals'],
    sections: [
      S('What is OSINT?', 'Open Source Intelligence is intelligence collected from publicly available sources. Security teams use OSINT for attack surface mapping, phishing attribution, fraud tracking, and verifying employee disclosures.'),
      S('OSINT sources', '', [
        'DNS & certificate transparency (crt.sh)',
        'WHOIS & passive DNS',
        'Social media & professional networks',
        'Breached credential databases (authorized use only)',
        'Satellite & geolocation metadata',
        'Dark web monitoring (specialized services)',
        'Company filings and job postings (tech stack hints)'
      ], [
        L('OSINT Framework', 'https://osintframework.com/', 'website'),
        L('crt.sh', 'https://crt.sh/', 'tool'),
        L('Maltego', 'https://www.maltego.com/', 'tool')
      ]),
      S('Operational security for investigators', 'Use dedicated VMs, VPNs, burner accounts where appropriate, and document sources. Avoid tipping off targets during sensitive investigations.'),
      S('Legal & privacy boundaries', 'OSINT must respect privacy laws and terms of service. Do not stalk individuals outside legitimate investigations. Corporate OSINT should follow HR/legal guidance.')
    ]
  },
  {
    slug: 'essential-security-tools',
    title: 'Essential Security Tools',
    summary: 'Must-know tools for ethical hacking, pentesting, forensics, and blue team — platforms, scanners, analyzers, and utilities.',
    icon: '🧰',
    category: 'tools',
    difficulty: 'beginner',
    readingMinutes: 18,
    featured: true,
    order: 1,
    tags: ['tools', 'Kali', 'Burp', 'Wireshark', 'Volatility'],
    relatedSlugs: ['programming-libraries-security', 'learning-platforms-resources'],
    sections: [
      S('Linux distributions', '', [], [
        L('Kali Linux', 'https://www.kali.org/', 'tool'),
        L('Parrot OS', 'https://www.parrotsec.org/', 'tool'),
        L('REMnux', 'https://remnux.org/', 'tool')
      ]),
      S('Offensive / pentest', '', [], [
        L('Burp Suite', 'https://portswigger.net/burp', 'tool'),
        L('Metasploit', 'https://www.metasploit.com/', 'tool'),
        L('Nmap', 'https://nmap.org/', 'tool'),
        L('Hashcat', 'https://hashcat.net/hashcat/', 'tool'),
        L('Gobuster / Feroxbuster', 'https://github.com/OJ/gobuster', 'tool')
      ]),
      S('Defensive / monitoring', '', [], [
        L('Wireshark', 'https://www.wireshark.org/', 'tool'),
        L('Zeek', 'https://zeek.org/', 'tool'),
        L('Suricata', 'https://suricata.io/', 'tool'),
        L('Wazuh', 'https://wazuh.com/', 'tool'),
        L('Elastic Stack', 'https://www.elastic.co/security', 'tool')
      ]),
      S('Forensics & malware', '', [], [
        L('Autopsy', 'https://www.autopsy.com/', 'tool'),
        L('Volatility', 'https://volatilityfoundation.org/', 'tool'),
        L('YARA', 'https://virustotal.github.io/yara/', 'tool'),
        L('IDA / Ghidra', 'https://ghidra-sre.org/', 'tool')
      ])
    ],
    tools: [
      T('Kali Linux', 'Offensive security distribution', 'https://www.kali.org/', 'platform'),
      T('Burp Suite', 'Web application testing proxy', 'https://portswigger.net/burp', 'web'),
      T('Nmap', 'Network scanner', 'https://nmap.org/', 'network'),
      T('Wireshark', 'Protocol analyzer', 'https://www.wireshark.org/', 'network'),
      T('Volatility', 'Memory forensics', 'https://volatilityfoundation.org/', 'forensics'),
      T('Ghidra', 'NSA reverse engineering suite', 'https://ghidra-sre.org/', 'malware')
    ]
  },
  {
    slug: 'programming-libraries-security',
    title: 'Programming Languages & Security Libraries',
    summary: 'Python, Go, and JavaScript libraries for security automation, scanning, forensics, and secure development.',
    icon: '💻',
    category: 'tools',
    difficulty: 'intermediate',
    readingMinutes: 14,
    order: 2,
    tags: ['Python', 'libraries', 'automation', 'scripting'],
    relatedSlugs: ['essential-security-tools', 'web-application-pentesting'],
    sections: [
      S('Why coding matters in security', 'Automation scales repetitive tasks — parsing logs, scanning APIs, extracting IOCs, generating reports. Python dominates security tooling; learn basics early.'),
      S('Python — offensive & automation', '', [], [
        L('Requests / HTTPX', 'https://www.python-httpx.org/', 'library'),
        L('Scapy', 'https://scapy.net/', 'library'),
        L('Impacket', 'https://github.com/fortra/impacket', 'repo'),
        L('Pwntools', 'https://github.com/Gallopsled/pwntools', 'repo'),
        L('PyCryptodome', 'https://www.pycryptodome.org/', 'library')
      ]),
      S('Python — defensive & forensics', '', [], [
        L('Volatility 3', 'https://github.com/volatilityfoundation/volatility3', 'repo'),
        L('YARA-Python', 'https://virustotal.github.io/yara/', 'library'),
        L('Pandas', 'https://pandas.pydata.org/', 'library'),
        L('Sigma rules', 'https://github.com/SigmaHQ/sigma', 'repo')
      ]),
      S('JavaScript / Node security', '', [], [
        L('OWASP NodeGoat', 'https://owasp.org/www-project-nodegoat/', 'course'),
        L('Semgrep', 'https://semgrep.dev/', 'tool'),
        L('Snyk', 'https://snyk.io/', 'tool')
      ]),
      S('Secure coding resources', '', [], [
        L('OWASP Cheat Sheet Series', 'https://cheatsheetseries.owasp.org/', 'standard'),
        L('CWE Top 25', 'https://cwe.mitre.org/top25/', 'standard')
      ])
    ]
  },
  {
    slug: 'learning-platforms-resources',
    title: 'Learning Platforms & Practice Labs',
    summary: 'Best websites, labs, CTF platforms, and communities to build hands-on cybersecurity skills.',
    icon: '🌐',
    category: 'resources',
    difficulty: 'beginner',
    readingMinutes: 12,
    featured: true,
    order: 1,
    tags: ['learning', 'CTF', 'labs', 'practice', 'TryHackMe'],
    relatedSlugs: ['certifications-roadmap', 'ethical-hacker-role'],
    sections: [
      S('Hands-on practice platforms', 'Reading alone is insufficient. These platforms provide legal environments to break things and learn.', [], [
        L('TryHackMe', 'https://tryhackme.com/', 'course'),
        L('Hack The Box', 'https://www.hackthebox.com/', 'course'),
        L('CyberLab (this platform)', '/', 'course'),
        L('PentesterLab', 'https://pentesterlab.com/', 'course'),
        L('OverTheWire', 'https://overthewire.org/wargames/', 'course'),
        L('picoCTF', 'https://picoctf.org/', 'course')
      ]),
      S('Free training & references', '', [], [
        L('Cybrary', 'https://www.cybrary.it/', 'course'),
        L('SANS Reading Room', 'https://www.sans.org/white-papers/', 'book'),
        L('PortSwigger Academy', 'https://portswigger.net/web-security', 'course'),
        L('MITRE ATT&CK', 'https://attack.mitre.org/', 'standard'),
        L('NIST Publications', 'https://csrc.nist.gov/publications', 'standard')
      ]),
      S('CTF & competitions', 'Capture The Flag events build speed, creativity, and teamwork. Categories: web, crypto, pwn, reversing, forensics, OSINT.', [], [
        L('CTFtime', 'https://ctftime.org/', 'website'),
        L('PicoCTF', 'https://picoctf.org/', 'course')
      ]),
      S('Communities', '', [], [
        L('r/netsec', 'https://www.reddit.com/r/netsec/', 'website'),
        L('Blueteam Village', 'https://blueteamvillage.org/', 'website'),
        L('Local BSides conferences', 'https://www.securitybsides.com/', 'website')
      ]),
      S('News & threat intel', '', [], [
        L('Krebs on Security', 'https://krebsonsecurity.com/', 'website'),
        L('The Hacker News', 'https://thehackernews.com/', 'website'),
        L('CISA Alerts', 'https://www.cisa.gov/news-events/cybersecurity-advisories', 'website')
      ])
    ]
  },
  {
    slug: 'certifications-roadmap',
    title: 'Cybersecurity Certifications Roadmap',
    summary: 'Entry to expert certifications — CompTIA, CEH, OSCP, GCIH, GCFA, CISSP, and how to choose your path.',
    icon: '🎓',
    category: 'certifications',
    difficulty: 'beginner',
    readingMinutes: 15,
    featured: true,
    order: 1,
    tags: ['certifications', 'OSCP', 'CISSP', 'CompTIA', 'SANS'],
    relatedSlugs: ['cybersecurity-roles-overview', 'learning-platforms-resources'],
    sections: [
      S('How to choose a certification', 'Match certs to your target role. HR filters on CompTIA and CISSP; technical teams respect OSCP, GNFA, and SANS GIAC. Hands-on beats multiple entry-level paper certs.'),
      S('Entry level (foundations)', '', [], [
        L('CompTIA Security+', 'https://www.comptia.org/certifications/security', 'cert'),
        L('CompTIA Network+', 'https://www.comptia.org/certifications/network', 'cert'),
        L('Google Cybersecurity Certificate', 'https://grow.google/certificates/cybersecurity/', 'cert')
      ]),
      S('Offensive / pentest track', '', [], [
        L('CEH (EC-Council)', 'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/', 'cert'),
        L('eJPT', 'https://www.elearnsecurity.com/certification/ejpt/', 'cert'),
        L('PNPT', 'https://certifications.tcm-sec.com/pnpt/', 'cert'),
        L('OSCP (OffSec)', 'https://www.offsec.com/courses/pen-200/', 'cert'),
        L('OSEP / OSED (advanced OffSec)', 'https://www.offsec.com/', 'cert')
      ]),
      S('Defensive / SOC / IR track', '', [], [
        L('CySA+ (CompTIA)', 'https://www.comptia.org/certifications/cybersecurity-analyst', 'cert'),
        L('GCIH (SANS)', 'https://www.giac.org/certifications/incident-handler-gcih/', 'cert'),
        L('GCFA (SANS Forensics)', 'https://www.giac.org/certifications/forensic-analyst-gcfa/', 'cert'),
        L('BTL1 (Blue Team Labs)', 'https://blueteamlabs.online/', 'cert')
      ]),
      S('Management & architecture', '', [], [
        L('CISSP (ISC2)', 'https://www.isc2.org/certifications/cissp', 'cert'),
        L('CISM (ISACA)', 'https://www.isaca.org/credentialing/cism', 'cert'),
        L('CCSP (cloud)', 'https://www.isc2.org/certifications/ccsp', 'cert')
      ]),
      S('Forensics-specific', '', [], [
        L('CHFI (EC-Council)', 'https://www.eccouncil.org/programs/computer-hacking-forensic-investigator-chfi/', 'cert'),
        L('GCFE (SANS)', 'https://www.giac.org/certifications/forensics-examiner-gcfe/', 'cert'),
        L('EnCE (EnCase)', 'https://www.opentext.com/products/encase-forensic', 'cert')
      ])
    ]
  },
  {
    slug: 'cloud-security-basics',
    title: 'Cloud Security Basics',
    summary: 'Shared responsibility model, IAM, logging, misconfigurations, and securing AWS/Azure/GCP workloads.',
    icon: '☁️',
    category: 'fundamentals',
    difficulty: 'intermediate',
    readingMinutes: 11,
    order: 3,
    tags: ['cloud', 'AWS', 'IAM', 'misconfiguration'],
    relatedSlugs: ['blue-team-fundamentals', 'vulnerability-management'],
    sections: [
      S('Shared responsibility', 'Cloud providers secure the platform; customers secure their data, identities, configurations, and applications. Know which controls are yours.'),
      S('Top cloud risks', '', [
        'Overprivileged IAM roles and long-lived access keys',
        'Public S3 buckets / storage containers',
        'Missing MFA on console accounts',
        'Unpatched VM images',
        'Exposed management ports',
        'Insufficient logging and alerting'
      ], [
        L('CSA Top Threats', 'https://cloudsecurityalliance.org/research/top-threats/', 'standard'),
        L('Prowler (AWS audit)', 'https://github.com/prowler-cloud/prowler', 'tool')
      ]),
      S('Cloud security practices', '', [
        'Least privilege IAM with role assumption',
        'Centralized logging (CloudTrail, Activity Log)',
        'Infrastructure as Code with policy scanning',
        'Network segmentation — VPCs, security groups',
        'Secrets in vaults, not environment variables in repos'
      ])
    ]
  },
  {
    slug: 'malware-analysis-intro',
    title: 'Malware Analysis Introduction',
    summary: 'Static vs dynamic analysis, sandboxes, YARA rules, and safe lab setup for analyzing malicious software.',
    icon: '🦠',
    category: 'forensics',
    difficulty: 'advanced',
    readingMinutes: 13,
    order: 3,
    tags: ['malware', 'reverse engineering', 'YARA', 'sandbox'],
    relatedSlugs: ['digital-forensics-fundamentals', 'essential-security-tools'],
    sections: [
      S('Analysis goals', 'Determine what malware does, how it persists, what it communicates with, and extract IOCs for detection across the enterprise.'),
      S('Static analysis', 'Examine without execution — strings, imports, PE headers, entropy, embedded resources. Tools: peid, DIE, FLOSS.', [
        'Hash sample (SHA-256) and check VirusTotal (aware of upload implications)',
        'Identify packing/obfuscation',
        'Extract strings and suspicious API imports',
        'Review .NET/Java decompilation when applicable'
      ]),
      S('Dynamic analysis', 'Execute in isolated sandbox, monitor behavior — file writes, registry, network callbacks.', [], [
        L('ANY.RUN', 'https://any.run/', 'tool'),
        L('Cuckoo Sandbox', 'https://cuckoosandbox.org/', 'tool'),
        L('Flare VM', 'https://github.com/mandiant/flare-vm', 'repo')
      ]),
      S('Safety requirements', 'Never analyze unknown malware on production networks. Use air-gapped or VLAN-isolated VMs with snapshots. Assume samples are actively malicious.')
    ]
  },
  {
    slug: 'governance-frameworks',
    title: 'Governance Frameworks — NIST, ISO 27001, CIS',
    summary: 'Major security frameworks for building and measuring security programs.',
    icon: '📋',
    category: 'governance',
    difficulty: 'intermediate',
    readingMinutes: 10,
    order: 3,
    tags: ['NIST', 'ISO 27001', 'CIS', 'compliance'],
    relatedSlugs: ['security-fundamentals-cia', 'vulnerability-management'],
    sections: [
      S('Why frameworks?', 'Frameworks provide structured control sets and maturity models. They help communicate with auditors, executives, and regulators using common language.'),
      S('Popular frameworks', '', [], [
        L('NIST CSF 2.0', 'https://www.nist.gov/cyberframework', 'standard'),
        L('ISO/IEC 27001', 'https://www.iso.org/isoiec-27001-information-security.html', 'standard'),
        L('CIS Controls', 'https://www.cisecurity.org/controls', 'standard'),
        L('SOC 2', 'https://www.aicpa.org/soc', 'standard'),
        L('PCI DSS', 'https://www.pcisecuritystandards.org/', 'standard')
      ]),
      S('Mapping controls', 'Organizations often map ISO controls to NIST CSF functions (Identify, Protect, Detect, Respond, Recover) to unify compliance efforts across frameworks.')
    ]
  }
];

module.exports = { articles };
