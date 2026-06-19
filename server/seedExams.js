const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exam = require('./models/Exam');

dotenv.config();

const q = (question, options, correctIndex, topic, explanation) => ({
  question, options, correctIndex, topic, explanation
});

const exams = [
  {
    slug: 'beginner',
    title: 'Beginner Exam',
    description: 'Foundational cybersecurity knowledge covering CIA triad, basic threats, passwords, networking, and security hygiene. Ideal before pursuing specialized certs.',
    icon: '🌱',
    category: 'beginner',
    difficulty: 'easy',
    durationMinutes: 30,
    passThreshold: 70,
    pointsReward: 75,
    xpReward: 100,
    order: 1,
    questions: [
      q('What does the "C" in the CIA triad stand for?', ['Control', 'Confidentiality', 'Compliance', 'Continuity'], 1, 'Fundamentals', 'Confidentiality ensures data is accessible only to authorized parties.'),
      q('Which attack sends fraudulent emails to steal credentials?', ['DDoS', 'Phishing', 'SQL Injection', 'Buffer overflow'], 1, 'Threats', 'Phishing uses social engineering via email or messages.'),
      q('What is the recommended minimum length for a strong password in most standards?', ['4 characters', '6 characters', '12+ characters', 'Exactly 8 characters'], 2, 'Access Control', 'Longer passwords resist brute-force attacks significantly better.'),
      q('HTTPS primarily protects data using:', ['Firewall rules', 'TLS encryption', 'MAC filtering', 'Port knocking'], 1, 'Networking', 'TLS encrypts data in transit between client and server.'),
      q('A firewall is primarily used to:', ['Encrypt files at rest', 'Filter network traffic', 'Scan malware on disk', 'Manage user passwords'], 1, 'Networking', 'Firewalls enforce allow/deny rules on network traffic.'),
      q('Two-factor authentication (2FA) adds security by requiring:', ['Two passwords', 'Something you know plus something you have/are', 'Two usernames', 'Two firewalls'], 1, 'Access Control', '2FA combines factors like password + OTP or biometrics.'),
      q('Malware that encrypts files and demands payment is called:', ['Spyware', 'Ransomware', 'Adware', 'Rootkit'], 1, 'Malware', 'Ransomware extorts victims for decryption keys.'),
      q('Principle of least privilege means users should receive:', ['Admin rights by default', 'Only permissions needed for their role', 'No permissions ever', 'Shared accounts'], 1, 'Access Control', 'Limiting privileges reduces blast radius of compromise.'),
      q('Which port does HTTPS commonly use?', ['21', '22', '80', '443'], 3, 'Networking', 'Port 443 is the standard for HTTPS traffic.'),
      q('A security patch should be applied to:', ['Only web servers', 'Systems with known vulnerabilities', 'Only Linux systems', 'Never in production'], 1, 'Operations', 'Patching closes known vulnerabilities before exploitation.'),
      q('Social engineering attacks exploit:', ['CPU bugs', 'Human psychology', 'Network cables', 'Database indexes'], 1, 'Threats', 'Attackers manipulate people into breaking security procedures.'),
      q('Backing up data regularly helps ensure:', ['Faster internet', 'Availability after data loss', 'Stronger passwords', 'Lower latency'], 1, 'Operations', 'Backups support recovery and the Availability pillar of CIA.')
    ]
  },
  {
    slug: 'web-security',
    title: 'Web Security Exam',
    description: 'Certification-style assessment on OWASP risks, injection flaws, XSS, authentication, session management, and secure web development practices.',
    icon: '🌐',
    category: 'web',
    difficulty: 'medium',
    durationMinutes: 45,
    passThreshold: 70,
    pointsReward: 150,
    xpReward: 200,
    order: 2,
    questions: [
      q('SQL injection occurs when user input is:', ['Hashed before storage', 'Concatenated into SQL queries unsafely', 'Validated on the client only', 'Compressed'], 1, 'Injection', 'Unsanitized input can alter SQL query logic.'),
      q('Reflected XSS executes malicious script when:', ['Server stores payload permanently', 'Victim loads a crafted URL/reflected response', 'Database is corrupted', 'TLS is disabled'], 1, 'XSS', 'Reflected XSS bounces off the server in an immediate response.'),
      q('Stored XSS is more dangerous than reflected XSS because:', ['It only affects admins', 'Payload persists and affects multiple users', 'It cannot be detected', 'It requires HTTPS'], 1, 'XSS', 'Stored XSS hits every user who views the infected content.'),
      q('CSRF attacks trick authenticated users into:', ['Downloading patches', 'Performing unwanted actions on a site', 'Changing their password securely', 'Enabling 2FA'], 1, 'CSRF', 'Browsers send cookies automatically, enabling forged requests.'),
      q('The best defense against CSRF for state-changing requests is often:', ['Disabling JavaScript', 'Anti-CSRF tokens', 'Longer passwords', 'URL shortening'], 1, 'CSRF', 'Synchronizer tokens validate intentional user actions.'),
      q('Content Security Policy (CSP) helps mitigate:', ['SQL injection', 'XSS by restricting script sources', 'DDoS attacks', 'Physical theft'], 1, 'Defense', 'CSP limits where scripts and resources can load from.'),
      q('IDOR (Insecure Direct Object Reference) allows attackers to:', ['Access other users\' objects by changing IDs', 'Inject SQL only', 'Crack TLS', 'Bypass firewalls'], 0, 'Access Control', 'Missing authorization checks expose objects by reference.'),
      q('Prepared statements primarily prevent:', ['XSS', 'SQL injection', 'CSRF', 'Clickjacking'], 1, 'Injection', 'Parameterization separates code from data.'),
      q('HTTP-only cookie flag helps reduce theft via:', ['SQL injection', 'Cross-site scripting accessing document.cookie', 'Port scanning', 'ARP spoofing'], 1, 'Sessions', 'JavaScript cannot read HttpOnly cookies.'),
      q('Directory traversal uses sequences like ../ to:', ['Speed up downloads', 'Read files outside the web root', 'Enable HTTPS', 'Hash passwords'], 1, 'Path Traversal', 'Path manipulation accesses unintended files.'),
      q('OWASP Top 10 is a list of:', ['Certified vendors', 'Most critical web application security risks', 'Approved programming languages', 'Firewall brands'], 1, 'OWASP', 'OWASP Top 10 guides prioritization of web app risks.'),
      q('Output encoding when rendering user data prevents:', ['Database corruption', 'XSS in HTML context', 'DNS poisoning', 'Disk failure'], 1, 'XSS', 'Context-appropriate encoding neutralizes malicious markup.')
    ]
  },
  {
    slug: 'linux-security',
    title: 'Linux Security Exam',
    description: 'Assess Linux hardening, permissions, logging, process management, privilege escalation vectors, and command-line incident detection skills.',
    icon: '🐧',
    category: 'linux',
    difficulty: 'medium',
    durationMinutes: 45,
    passThreshold: 70,
    pointsReward: 150,
    xpReward: 200,
    order: 3,
    questions: [
      q('In ls -la output, which permission set applies to the file owner?', ['First trio (rwx)', 'Second trio', 'Third trio', 'The number after permissions'], 0, 'Permissions', 'Owner, group, and others each have rwx triples.'),
      q('The setuid bit on a binary allows it to run with:', ['No permissions', 'Owner\'s privileges', 'World-writable access', 'Kernel-only mode'], 1, 'Privileges', 'Setuid executables run with the file owner\'s effective UID.'),
      q('Which file typically stores user account information (non-shadow)?', ['/etc/shadow', '/etc/passwd', '/etc/hosts', '/var/log/auth.log'], 1, 'System Files', '/etc/passwd lists users; hashes live in /etc/shadow.'),
      q('To view failed SSH login attempts on many distros, check:', ['/etc/motd', '/var/log/auth.log or journalctl', '/proc/cpuinfo', '/tmp/sshd'], 1, 'Logging', 'Auth logs record SSH success and failure events.'),
      q('chmod 600 on a file means:', ['Readable/writable by owner only', 'Executable by everyone', 'World-readable', 'Immutable'], 0, 'Permissions', '6 = rw- for owner; group and others have no access.'),
      q('Finding SUID binaries is commonly done with:', ['grep /etc/passwd', 'find / -perm -4000 2>/dev/null', 'ping localhost', 'systemctl stop ssh'], 1, 'Enumeration', 'SUID binaries are frequent privesc targets.'),
      q('The sudo command allows:', ['Bypassing all security', 'Running commands as another user (often root)', 'Deleting the kernel', 'Disabling logs'], 1, 'Privileges', 'sudo enforces policy-defined elevated execution.'),
      q('A world-writable /etc/passwd file is dangerous because:', ['It speeds up login', 'Anyone could add or modify user entries', 'It disables networking', 'It enables HTTPS'], 1, 'Misconfiguration', 'Writable passwd files enable privilege manipulation.'),
      q('Which tool filters and displays log files on systemd systems?', ['iptables', 'journalctl', 'netstat only', 'fdisk'], 1, 'Logging', 'journalctl queries the systemd journal.'),
      q('AppArmor and SELinux provide:', ['Disk encryption only', 'Mandatory access control frameworks', 'Wireless management', 'Package updates'], 1, 'Hardening', 'MAC frameworks confine processes beyond standard DAC.'),
      q('Running netstat or ss helps identify:', ['CPU temperature', 'Listening ports and connections', 'User passwords', 'File hashes'], 1, 'Network', 'Socket listings reveal services and connections.'),
      q('Cron jobs defined system-wide may appear in:', ['/etc/crontab and /etc/cron.*', '/home/user/.bashrc only', '/dev/null', '/proc/net'], 0, 'Persistence', 'Cron is a common persistence and privesc vector.')
    ]
  },
  {
    slug: 'incident-response',
    title: 'Incident Response Exam',
    description: 'Test knowledge of the IR lifecycle, triage, containment, evidence handling, SIEM concepts, and common attack patterns seen in SOC operations.',
    icon: '🚨',
    category: 'incident-response',
    difficulty: 'hard',
    durationMinutes: 60,
    passThreshold: 70,
    pointsReward: 200,
    xpReward: 250,
    order: 4,
    questions: [
      q('The first phase of the NIST incident response lifecycle is:', ['Recovery', 'Preparation', 'Containment', 'Lessons learned'], 1, 'IR Lifecycle', 'Preparation includes policies, tools, and training before incidents.'),
      q('During containment, the primary goal is to:', ['Delete all logs', 'Limit damage and stop spread', 'Publicly announce breaches immediately', 'Reimage all systems without analysis'], 1, 'Containment', 'Containment isolates threats while preserving evidence.'),
      q('Chain of custody documentation ensures:', ['Faster internet', 'Evidence integrity and admissibility', 'Automatic patching', 'Password rotation'], 1, 'Forensics', 'Custody records who handled evidence and when.'),
      q('A SIEM primarily:', ['Patches servers', 'Aggregates and correlates security logs', 'Replaces firewalls', 'Encrypts databases'], 1, 'SIEM', 'SIEMs centralize log analysis and alerting.'),
      q('An IOC (Indicator of Compromise) might be:', ['A malicious IP, hash, or domain', 'A user\'s favorite color', 'Office hours', 'CPU model'], 0, 'Threat Intel', 'IOCs are artifacts used to detect compromise.'),
      q('Lateral movement refers to attackers:', ['Moving physically between buildings', 'Spreading across systems in a network', 'Upgrading TLS versions', 'Rotating passwords'], 1, 'TTPs', 'Attackers pivot between hosts after initial access.'),
      q('Phishing triage should FIRST focus on:', ['Deleting all email', 'Identifying scope, recipients, and malicious indicators', 'Disabling the internet', 'Formatting workstations'], 1, 'Triage', 'Scope assessment guides containment and notification.'),
      q('Memory forensics captures:', ['Only firewall rules', 'Volatile runtime artifacts like processes and network connections', 'Physical badge photos', 'Printer settings'], 1, 'Forensics', 'RAM holds ephemeral evidence lost on shutdown.'),
      q('The MITRE ATT&CK framework catalogs:', ['Programming tutorials', 'Adversary tactics and techniques', 'Hardware prices', 'SSL certificate vendors'], 1, 'Frameworks', 'ATT&CK maps real-world attacker behavior.'),
      q('Eradication phase involves:', ['Ignoring root cause', 'Removing malware and attacker access', 'Skipping backups', 'Disabling monitoring'], 1, 'IR Lifecycle', 'Eradication eliminates the threat from the environment.'),
      q('A false positive in alerting means:', ['A real breach occurred', 'Benign activity triggered an alert', 'Logs were deleted', 'SIEM was patched'], 1, 'SOC Operations', 'Tuning reduces noise from false positives.'),
      q('Post-incident lessons learned should produce:', ['No documentation', 'Actionable improvements to people, process, and technology', 'Immediate public blame', 'Permanent monitoring shutdown'], 1, 'IR Lifecycle', 'Reviews drive maturity and prevent recurrence.')
    ]
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    await Exam.deleteMany({});
    await Exam.insertMany(exams);
    console.log(`Seeded ${exams.length} practice exams!`);
    exams.forEach(e => console.log(`  · ${e.title} (${e.questions.length} questions)`));
    mongoose.connection.close();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seed();
