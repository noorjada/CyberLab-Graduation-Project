const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lab = require('./models/Lab');

dotenv.config();

const labs = [
  {
    title: 'Basic Linux Enumeration',
    description: 'You have been given access to a Linux machine. Your goal is to enumerate the system, find hidden files, and capture the flag. Practice basic Linux commands in a real environment.',
    category: 'linux',
    difficulty: 'easy',
    points: 100,
    dockerImage: 'cyberlab-linux-basic',
    flag: 'FLAG{linux_enum_master}',
    tasks: [
      { title: 'Find your username', description: 'Use the whoami command', hint: 'Try: whoami', points: 10 },
      { title: 'List hidden files', description: 'Find hidden files in the home directory', hint: 'Try: ls -la', points: 20 },
      { title: 'Read the flag file', description: 'Find and read the flag', hint: 'Try: find / -name "*.txt" 2>/dev/null', points: 70 }
    ],
    tools: ['bash', 'find', 'cat', 'ls'],
    estimatedTime: 20
  },
  {
    title: 'SQL Injection Attack',
    description: 'A vulnerable web application is running on this machine. Find the SQL injection vulnerability in the login form and bypass authentication to get the flag.',
    category: 'web',
    difficulty: 'medium',
    points: 200,
    dockerImage: 'cyberlab-web-basic',
    flag: 'FLAG{sqli_web_pwned}',
    tasks: [
      { title: 'Access the web app', description: 'Open the web application in your browser', hint: 'Check the HTTP port shown after starting the lab', points: 20 },
      { title: 'Test for SQL injection', description: 'Try SQL injection on the login form', hint: "Try entering: ' OR '1'='1 in the username field", points: 80 },
      { title: 'Get the flag', description: 'Successfully bypass the login', hint: "Username: ' OR '1'='1' -- and any password", points: 100 }
    ],
    tools: ['browser', 'Burp Suite', 'curl'],
    estimatedTime: 30
  },
  {
    title: 'Network Traffic Analysis',
    description: 'Network traffic has been captured on this machine. Analyze the capture files to find credentials transmitted in plaintext and discover the hidden flag.',
    category: 'network',
    difficulty: 'medium',
    points: 150,
    dockerImage: 'cyberlab-network-basic',
    flag: 'FLAG{wireshark_network_ninja}',
    tasks: [
      { title: 'Find capture files', description: 'Locate the network capture files', hint: 'Check /home/analyst/captures/', points: 30 },
      { title: 'Analyze traffic', description: 'Find plaintext credentials in the capture', hint: 'Try: cat /home/analyst/captures/traffic.txt', points: 70 },
      { title: 'Get the flag', description: 'Find the flag in the traffic', hint: 'Read the entire traffic file carefully', points: 50 }
    ],
    tools: ['cat', 'grep', 'strings', 'tcpdump'],
    estimatedTime: 25
  },
  {
    title: 'Linux Privilege Escalation',
    description: 'You have a low-privilege shell on a Linux system. Find the misconfigured SUID binary and escalate your privileges to root to read the flag in /root/flag.txt.',
    category: 'linux',
    difficulty: 'hard',
    points: 300,
    dockerImage: 'cyberlab-privesc',
    flag: 'FLAG{r00t_pr1v3sc_master}',
    tasks: [
      { title: 'Check your privileges', description: 'Find out who you are and what groups you belong to', hint: 'Try: id && whoami', points: 30 },
      { title: 'Find SUID binaries', description: 'Search for SUID binaries on the system', hint: 'Try: find / -perm -u=s -type f 2>/dev/null', points: 100 },
      { title: 'Exploit and get root', description: 'Use the SUID binary to read the root flag', hint: 'Try: find . -exec /bin/bash -p \\; then cat /root/flag.txt', points: 170 }
    ],
    tools: ['find', 'bash', 'id', 'whoami'],
    estimatedTime: 45
  },

  // --- New labs ---

  {
    title: 'Reflected XSS Attack',
    description: 'A vulnerable search portal reflects user input directly into the page without sanitization. Inject a malicious JavaScript payload to trigger XSS and capture the flag.',
    category: 'web',
    difficulty: 'easy',
    points: 150,
    dockerImage: 'cyberlab-xss',
    flag: 'FLAG{xss_r3fl3ct3d_pwn3d}',
    tasks: [
      { title: 'Access the web app', description: 'Open the vulnerable search portal in your browser', hint: 'Use the HTTP port shown after starting the lab', points: 20 },
      { title: 'Test for reflection', description: 'Confirm that input is reflected unsanitized in the response', hint: 'Try searching for: <b>test</b> and see if bold text appears', points: 30 },
      { title: 'Inject XSS payload', description: 'Inject a script tag to trigger XSS and reveal the flag', hint: 'Try: <script>alert(1)</script> in the search box', points: 100 }
    ],
    tools: ['browser', 'curl', 'Burp Suite'],
    estimatedTime: 20
  },

  {
    title: 'Command Injection via Ping',
    description: 'A web application passes user-supplied input to a system ping command without validation. Exploit the command injection to execute arbitrary OS commands and read the flag.',
    category: 'web',
    difficulty: 'medium',
    points: 200,
    dockerImage: 'cyberlab-cmd-injection',
    flag: 'FLAG{cmd_1nj3ct10n_rce}',
    tasks: [
      { title: 'Access the ping tool', description: 'Open the network ping utility in your browser', hint: 'Use the HTTP port shown after starting the lab', points: 20 },
      { title: 'Test normal functionality', description: 'Ping 127.0.0.1 to confirm the tool works', hint: 'Enter: 127.0.0.1 and click Ping', points: 30 },
      { title: 'Inject a command', description: 'Append a shell command to the input to read /root/flag.txt', hint: 'Try: 127.0.0.1; cat /root/flag.txt', points: 150 }
    ],
    tools: ['browser', 'curl', 'Burp Suite'],
    estimatedTime: 25
  },

  {
    title: 'MD5 Hash Cracking',
    description: 'You have obtained MD5 password hashes from a compromised server. Crack the admin hash using Python or John the Ripper, then use the recovered password to unlock the flag vault.',
    category: 'crypto',
    difficulty: 'easy',
    points: 100,
    dockerImage: 'cyberlab-hash-crack',
    flag: 'FLAG{h4sh_cr4ck3r_pr0}',
    tasks: [
      { title: 'Read the challenge', description: 'Read readme.txt to understand the task', hint: 'Try: cat readme.txt', points: 10 },
      { title: 'Crack the hash', description: 'Crack the MD5 hash in challenge/admin.hash', hint: 'Try: echo -e "admin\\npassword\\npassword123" | md5crack', points: 60 },
      { title: 'Unlock the vault', description: 'Use the cracked password to get the flag', hint: 'Try: vault_unlock <cracked_password>', points: 30 }
    ],
    tools: ['python3', 'john', 'md5crack', 'vault_unlock'],
    estimatedTime: 20
  },

  {
    title: 'SSH Brute Force Attack',
    description: 'A remote user has set a weak SSH password. Use Hydra to brute force the credentials, then SSH in to capture the flag from their home directory.',
    category: 'network',
    difficulty: 'medium',
    points: 200,
    dockerImage: 'cyberlab-ssh-brute',
    flag: 'FLAG{ssh_brut3_f0rc3_0wn3d}',
    tasks: [
      { title: 'Read the instructions', description: 'Review the challenge brief', hint: 'Try: cat readme.txt', points: 10 },
      { title: 'Start the SSH service', description: 'Ensure the SSH server is running on localhost', hint: 'Try: sudo /usr/sbin/sshd', points: 20 },
      { title: 'Brute force with Hydra', description: 'Use Hydra to find the victim user\'s password', hint: 'Try: hydra -l victim -P ~/wordlist.txt ssh://127.0.0.1 -t 4', points: 100 },
      { title: 'Retrieve the flag', description: 'SSH in as victim and read the flag', hint: 'Try: sshpass -p <PASSWORD> ssh -o StrictHostKeyChecking=no victim@127.0.0.1 cat flag.txt', points: 70 }
    ],
    tools: ['hydra', 'sshpass', 'ssh'],
    estimatedTime: 30
  },

  {
    title: 'Cron Job Privilege Escalation',
    description: 'A root-owned cron job runs a world-writable script every minute. Inject a malicious command into the script, wait for cron to execute it as root, and read the flag.',
    category: 'linux',
    difficulty: 'hard',
    points: 300,
    dockerImage: 'cyberlab-cronjob',
    flag: 'FLAG{cr0n_j0b_pr1v3sc_pwn3d}',
    tasks: [
      { title: 'Enumerate cron jobs', description: 'Find scheduled tasks running as root', hint: 'Try: cat /etc/crontab', points: 30 },
      { title: 'Find writable script', description: 'Identify the world-writable script in the cron job', hint: 'Try: ls -la /opt/scripts/', points: 50 },
      { title: 'Inject payload', description: 'Append a command to copy the root flag to /tmp', hint: 'Try: echo "cp /root/flag.txt /tmp/f.txt; chmod 777 /tmp/f.txt" >> /opt/scripts/cleanup.sh', points: 120 },
      { title: 'Read the flag', description: 'Wait ~60 seconds for cron to run, then read the flag', hint: 'Try: cat /tmp/f.txt  (after waiting ~1 minute)', points: 100 }
    ],
    tools: ['bash', 'crontab', 'find', 'echo'],
    estimatedTime: 60
  },

  {
    title: 'Local File Inclusion (LFI)',
    description: 'A document portal uses a "page" parameter to include files server-side without path sanitization. Use path traversal to read sensitive files outside the web root and find the hidden flag.',
    category: 'web',
    difficulty: 'hard',
    points: 250,
    dockerImage: 'cyberlab-lfi',
    flag: 'FLAG{lfi_p4th_tr4v3rs4l_0wn3d}',
    tasks: [
      { title: 'Explore the portal', description: 'Browse the document portal and observe the URL parameter', hint: 'Notice the ?page= parameter in the URL', points: 20 },
      { title: 'Test path traversal', description: 'Attempt to read /etc/passwd using ../ sequences', hint: 'Try: ?page=../../etc/passwd', points: 80 },
      { title: 'Find the hidden flag', description: 'Locate and read the flag file in the admin directory', hint: 'Try: ?page=../html/admin/flag.txt', points: 150 }
    ],
    tools: ['browser', 'curl', 'Burp Suite'],
    estimatedTime: 35
  }
];

const enrichLab = (lab) => {
  const base = lab.flag.replace(/^FLAG\{/, '').replace(/\}$/, '');
  const flags = lab.tasks.map((task, i) => ({
    key: `flag_${i + 1}`,
    label: task.title,
    flag: i === lab.tasks.length - 1
      ? lab.flag
      : `FLAG{${base}_step${i + 1}}`,
    points: task.points || Math.floor(lab.points / lab.tasks.length),
    order: i + 1
  }));

  const hints = lab.tasks.map(t => t.hint).filter(Boolean);
  while (hints.length < 3) {
    hints.push(
      hints.length === 0
        ? `Start by exploring the ${lab.category} environment with basic enumeration.`
        : `Use recommended tools: ${(lab.tools || []).join(', ')}`
    );
  }

  const walkthrough = {
    content: `${lab.title} — step-by-step solution.\n\n${lab.description}`,
    steps: lab.tasks.map((t, i) =>
      `${i + 1}. ${t.title}: ${t.hint || t.description}`
    ),
    tools: lab.tools || [],
    author: 'CyberLab Team'
  };

  return {
    ...lab,
    flags,
    hints: hints.slice(0, 5),
    hintCosts: [0, 15, 30, 45, 60].slice(0, Math.min(5, hints.length)),
    walkthrough
  };
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    await Lab.deleteMany({});
    console.log('Cleared existing labs');
    const enriched = labs.map(enrichLab);
    await Lab.insertMany(enriched);
    console.log(`Added ${enriched.length} labs with multi-flag ecosystem!`);
    mongoose.connection.close();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seed();