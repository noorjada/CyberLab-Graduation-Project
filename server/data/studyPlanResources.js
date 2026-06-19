/**
 * Canonical platform resources for study plan links.
 * Paths are validated by scripts/validate-study-plans.js
 */

const enc = (value) => encodeURIComponent(value);

/** @typedef {'challenge'|'lab'|'labs'|'reference'|'roadmap'|'soc'|'exams'|'exploits'|'notes'|'terminal'|'virustotal'|'certificates'|'course'|'external'} LinkType */

/**
 * @param {LinkType} type
 * @param {string} label
 * @param {string} path
 * @param {Record<string, string>} [meta]
 */
const link = (type, label, path, meta = {}) => ({ type, label, path, ...meta });

const CHALLENGES = {
  SQL_INJECTION: 'SQL Injection Basics',
  XSS: 'XSS Reflected Attack',
  STEGO: 'Hidden in Plain Sight',
  PCAP: 'Packet Capture Analysis',
  LINUX_PRIVESC: 'Linux Privilege Escalation',
  BASE64: 'Base64 Secrets',
  TRAVERSAL: 'Directory Traversal',
  PERMISSIONS: 'Linux File Permissions'
};

const LABS = {
  LINUX_ENUM: 'Basic Linux Enumeration',
  SQLI: 'SQL Injection Attack',
  NETWORK: 'Network Traffic Analysis',
  LINUX_PRIVESC: 'Linux Privilege Escalation',
  XSS: 'Reflected XSS Attack',
  CMD_INJ: 'Command Injection via Ping',
  HASH: 'MD5 Hash Cracking',
  SSH: 'SSH Brute Force Attack',
  CRON: 'Cron Job Privilege Escalation',
  LFI: 'Local File Inclusion (LFI)'
};

const EXAMS = {
  BEGINNER: 'beginner',
  WEB: 'web-security',
  LINUX: 'linux-security',
  IR: 'incident-response'
};

const REF = {
  ROLES: 'cybersecurity-roles-overview',
  ETHICAL_HACKER: 'ethical-hacker-role',
  PENTESTER: 'penetration-tester-role',
  FORENSICS_ROLE: 'digital-forensics-investigator',
  SOC_ROLE: 'soc-analyst-role',
  ETHICAL_HACKING: 'ethical-hacking-fundamentals',
  PTES: 'penetration-testing-methodology',
  WEB_PENTEST: 'web-application-pentesting',
  NETWORK_PENTEST: 'network-pentesting',
  DFIR: 'digital-forensics-fundamentals',
  IR: 'incident-response-lifecycle',
  BLUE_TEAM: 'blue-team-fundamentals',
  LEGAL: 'legal-ethical-framework',
  CIA: 'security-fundamentals-cia',
  CRYPTO: 'cryptography-fundamentals',
  VULN_MGMT: 'vulnerability-management',
  OSINT: 'osint-investigations',
  TOOLS: 'essential-security-tools',
  CERTS: 'certifications-roadmap',
  MALWARE: 'malware-analysis-intro',
  GOVERNANCE: 'governance-frameworks'
};

const challenge = (title, category) =>
  link('challenge', title, `/challenges?open=${enc(title)}&category=${category}`, { resourceTitle: title });

const lab = (title) =>
  link('lab', title, `/labs?open=${enc(title)}`, { resourceTitle: title });

const labs = (label, category) =>
  link('labs', label, category ? `/labs?category=${category}` : '/labs');

const reference = (slug, label) =>
  link('reference', label, `/reference/${slug}`, { resourceSlug: slug });

const referenceCat = (category, label) =>
  link('reference', label, `/reference?category=${category}`);

const exam = (slug, label) =>
  link('exams', label, `/exams?open=${slug}`, { resourceSlug: slug });

const external = (url, label) =>
  link('external', label, url);

const topic = (id, title, description, opts = {}) => ({
  id,
  title,
  description,
  day: opts.day,
  week: opts.week,
  estimatedHours: opts.hours ?? 2,
  objectives: opts.objectives || [],
  frameworks: opts.frameworks || [],
  links: opts.links || []
});

module.exports = {
  link,
  challenge,
  lab,
  labs,
  reference,
  referenceCat,
  exam,
  external,
  topic,
  CHALLENGES,
  LABS,
  EXAMS,
  REF,
  /** All challenge titles that must exist in DB */
  ALL_CHALLENGE_TITLES: Object.values(CHALLENGES),
  /** All lab titles that must exist in DB */
  ALL_LAB_TITLES: Object.values(LABS),
  /** All exam slugs that must exist in DB */
  ALL_EXAM_SLUGS: Object.values(EXAMS),
  /** All reference slugs used in study plans */
  ALL_REFERENCE_SLUGS: Object.values(REF),
  VALID_REFERENCE_CATEGORIES: [
    'fundamentals', 'pentesting', 'ethical-hacking', 'blue-team',
    'governance', 'forensics', 'tools', 'roles', 'certifications', 'resources'
  ]
};
