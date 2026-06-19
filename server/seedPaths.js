const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LearningPath = require('./models/LearningPath');

dotenv.config();

const paths = [
  {
    title: 'Linux Fundamentals',
    description: 'Master the Linux command line — the foundation of all hacking.',
    track: 'beginner',
    careerPath: 'general',
    icon: '🐧',
    color: '#f0c040',
    order: 1,
    modules: [
      {
        title: 'Getting started with Linux',
        description: 'Learn basic navigation and file management',
        icon: '📁',
        order: 1,
        topics: ['ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv'],
        xpReward: 100
      },
      {
        title: 'File permissions',
        description: 'Understand Linux permission system',
        icon: '🔐',
        order: 2,
        topics: ['chmod', 'chown', 'sudo', 'groups', 'passwd'],
        xpReward: 100
      },
      {
        title: 'Text processing',
        description: 'Search and manipulate text like a pro',
        icon: '📝',
        order: 3,
        topics: ['grep', 'cat', 'less', 'head', 'tail', 'awk', 'sed'],
        xpReward: 150
      },
      {
        title: 'Processes and networking',
        description: 'Monitor system and network activity',
        icon: '⚙️',
        order: 4,
        topics: ['ps', 'top', 'kill', 'netstat', 'ss', 'curl', 'wget'],
        xpReward: 150
      }
    ]
  },
  {
    title: 'Networking Basics',
    description: 'Understand how computers communicate — essential for any hacker.',
    track: 'beginner',
    careerPath: 'general',
    icon: '🌐',
    color: '#58a6ff',
    order: 2,
    modules: [
      {
        title: 'IP addressing and subnets',
        description: 'Learn how networks are structured',
        icon: '🗺️',
        order: 1,
        topics: ['IPv4', 'IPv6', 'subnets', 'CIDR', 'NAT', 'DHCP'],
        xpReward: 100
      },
      {
        title: 'TCP/IP and protocols',
        description: 'How data travels across networks',
        icon: '📡',
        order: 2,
        topics: ['TCP', 'UDP', 'DNS', 'HTTP', 'HTTPS', 'FTP', 'SSH'],
        xpReward: 100
      },
      {
        title: 'Network scanning with nmap',
        description: 'Discover hosts and open ports',
        icon: '🔍',
        order: 3,
        topics: ['nmap basics', 'port scanning', 'service detection', 'OS detection'],
        xpReward: 150
      },
      {
        title: 'Packet analysis with Wireshark',
        description: 'Capture and analyze network traffic',
        icon: '🦈',
        order: 4,
        topics: ['packet capture', 'filters', 'protocols', 'extracting data'],
        xpReward: 200
      }
    ]
  },
  {
    title: 'Web Security Basics',
    description: 'Learn how web applications work and where they break.',
    track: 'beginner',
    careerPath: 'pentester',
    icon: '🌍',
    color: '#3fb950',
    order: 3,
    modules: [
      {
        title: 'How the web works',
        description: 'HTTP, requests, responses and headers',
        icon: '🔗',
        order: 1,
        topics: ['HTTP methods', 'status codes', 'headers', 'cookies', 'sessions'],
        xpReward: 100
      },
      {
        title: 'Using Burp Suite',
        description: 'Intercept and modify web traffic',
        icon: '🛠️',
        order: 2,
        topics: ['proxy setup', 'intercepting', 'repeater', 'intruder basics'],
        xpReward: 150
      },
      {
        title: 'SQL injection basics',
        description: 'Attack vulnerable database queries',
        icon: '💉',
        order: 3,
        topics: ['what is SQLi', 'manual testing', 'bypass login', 'data extraction'],
        xpReward: 200
      },
      {
        title: 'XSS basics',
        description: 'Inject scripts into web pages',
        icon: '⚡',
        order: 4,
        topics: ['reflected XSS', 'stored XSS', 'DOM XSS', 'cookie stealing'],
        xpReward: 200
      }
    ]
  },
  {
    title: 'Cryptography',
    description: 'Break weak encryption and understand how data is protected.',
    track: 'beginner',
    careerPath: 'general',
    icon: '🔐',
    color: '#bc8cff',
    order: 4,
    modules: [
      {
        title: 'Encodings and ciphers',
        description: 'Recognize and decode common encodings',
        icon: '🔡',
        order: 1,
        topics: ['Base64', 'hex', 'binary', 'Caesar', 'ROT13', 'Vigenere'],
        xpReward: 100
      },
      {
        title: 'Hashing',
        description: 'Understand and crack password hashes',
        icon: '#️⃣',
        order: 2,
        topics: ['MD5', 'SHA1', 'SHA256', 'hashcat', 'rainbow tables'],
        xpReward: 150
      },
      {
        title: 'Modern cryptography',
        description: 'How real encryption works',
        icon: '🏛️',
        order: 3,
        topics: ['symmetric', 'asymmetric', 'RSA basics', 'AES', 'weak key attacks'],
        xpReward: 200
      }
    ]
  },
  {
    title: 'Web Application Attacks',
    description: 'Advanced web exploitation techniques used by real pentesters.',
    track: 'intermediate',
    careerPath: 'pentester',
    icon: '🕷️',
    color: '#f85149',
    order: 1,
    modules: [
      {
        title: 'Advanced SQLi',
        description: 'Blind, time-based and out-of-band injection',
        icon: '💉',
        order: 1,
        topics: ['blind SQLi', 'time-based', 'sqlmap', 'bypassing filters'],
        xpReward: 250
      },
      {
        title: 'File inclusion vulnerabilities',
        description: 'LFI and RFI to gain code execution',
        icon: '📂',
        order: 2,
        topics: ['LFI', 'RFI', 'path traversal', 'log poisoning'],
        xpReward: 250
      },
      {
        title: 'Authentication attacks',
        description: 'Break login systems and session management',
        icon: '🔓',
        order: 3,
        topics: ['brute force', 'credential stuffing', 'JWT attacks', 'CSRF'],
        xpReward: 300
      },
      {
        title: 'Server-side vulnerabilities',
        description: 'SSRF, XXE and command injection',
        icon: '💻',
        order: 4,
        topics: ['SSRF', 'XXE', 'command injection', 'SSTI'],
        xpReward: 350
      }
    ]
  },
  {
    title: 'Linux Privilege Escalation',
    description: 'Go from low-privilege user to root on Linux systems.',
    track: 'intermediate',
    careerPath: 'pentester',
    icon: '⬆️',
    color: '#f0c040',
    order: 2,
    modules: [
      {
        title: 'Enumeration',
        description: 'Gather system info after gaining access',
        icon: '🔎',
        order: 1,
        topics: ['linpeas', 'manual enum', 'system info', 'network info'],
        xpReward: 200
      },
      {
        title: 'SUID and capabilities',
        description: 'Exploit misconfigured binaries',
        icon: '⚙️',
        order: 2,
        topics: ['SUID binaries', 'GTFOBins', 'capabilities', 'sudo misconfig'],
        xpReward: 300
      },
      {
        title: 'Cron jobs and services',
        description: 'Exploit scheduled tasks and weak services',
        icon: '⏰',
        order: 3,
        topics: ['crontab abuse', 'writable scripts', 'path hijacking'],
        xpReward: 300
      },
      {
        title: 'Kernel exploits',
        description: 'Use public exploits against unpatched kernels',
        icon: '💣',
        order: 4,
        topics: ['kernel version', 'searchsploit', 'compiling exploits', 'dirty cow'],
        xpReward: 400
      }
    ]
  },
  {
    title: 'Digital Forensics',
    description: 'Investigate digital evidence and recover hidden data.',
    track: 'intermediate',
    careerPath: 'forensics',
    icon: '🔍',
    color: '#58a6ff',
    order: 3,
    modules: [
      {
        title: 'File analysis',
        description: 'Examine files and extract hidden data',
        icon: '📄',
        order: 1,
        topics: ['file command', 'strings', 'xxd', 'binwalk', 'exiftool'],
        xpReward: 150
      },
      {
        title: 'Steganography',
        description: 'Find data hidden inside images and audio',
        icon: '🖼️',
        order: 2,
        topics: ['steghide', 'zsteg', 'stegsolve', 'audio stego'],
        xpReward: 200
      },
      {
        title: 'Memory forensics',
        description: 'Analyze RAM dumps for evidence',
        icon: '🧠',
        order: 3,
        topics: ['Volatility', 'process analysis', 'network connections', 'dumping hashes'],
        xpReward: 300
      },
      {
        title: 'Disk forensics',
        description: 'Recover deleted files and analyze filesystems',
        icon: '💾',
        order: 4,
        topics: ['Autopsy', 'file carving', 'deleted files', 'timeline analysis'],
        xpReward: 300
      }
    ]
  },
  {
    title: 'Exploit Development',
    description: 'Write your own exploits from scratch — the pinnacle of offensive security.',
    track: 'advanced',
    careerPath: 'pentester',
    icon: '💀',
    color: '#f85149',
    order: 1,
    modules: [
      {
        title: 'Buffer overflow basics',
        description: 'Smash the stack and control execution',
        icon: '💥',
        order: 1,
        topics: ['stack layout', 'EIP control', 'bad chars', 'shellcode'],
        xpReward: 500
      },
      {
        title: 'SEH and egghunters',
        description: 'Bypass structured exception handling',
        icon: '🛡️',
        order: 2,
        topics: ['SEH chain', 'nSEH', 'egghunter technique'],
        xpReward: 600
      },
      {
        title: 'Return oriented programming',
        description: 'Bypass DEP with ROP chains',
        icon: '⛓️',
        order: 3,
        topics: ['ROP gadgets', 'ROPgadget', 'bypassing DEP', 'ret2libc'],
        xpReward: 700
      }
    ]
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    await LearningPath.deleteMany({});
    console.log('Cleared existing paths');
    await LearningPath.insertMany(paths);
    console.log(`Added ${paths.length} learning paths!`);
    mongoose.connection.close();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seed();