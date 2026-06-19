const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Challenge = require('./models/Challenge');

dotenv.config();

const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const challenges = [
  {
    title: 'SQL Injection Basics',
    description: 'A login form is vulnerable to SQL injection. Bypass the authentication and retrieve the hidden flag from the database.',
    category: 'web',
    difficulty: 'easy',
    points: 50,
    flag: 'FLAG{sql_1nj3ct10n_byp4ss}',
    hints: ['Try using single quotes', "Think about OR conditions", "Classic: ' OR '1'='1"]
  },
  {
    title: 'XSS Reflected Attack',
    description: 'Find and exploit a reflected XSS vulnerability in the search parameter to steal the session cookie.',
    category: 'web',
    difficulty: 'medium',
    points: 100,
    flag: 'FLAG{xss_r3fl3ct3d_c00k13}',
    hints: ['Check the search parameter in the URL', 'Try injecting a script tag']
  },
  {
    title: 'Hidden in Plain Sight',
    description: 'A secret flag has been hidden inside a PNG image using steganography. Extract it!',
    category: 'forensics',
    difficulty: 'easy',
    points: 50,
    flag: 'FLAG{st3g4n0gr4phy_1s_fun}',
    hints: ['Use steghide or strings command', 'Check the metadata']
  },
  {
    title: 'Packet Capture Analysis',
    description: 'Analyze the provided network capture file and find the credentials transmitted in plaintext.',
    category: 'network',
    difficulty: 'medium',
    points: 100,
    flag: 'FLAG{w1r3sh4rk_m4st3r}',
    hints: ['Use Wireshark', 'Filter by HTTP traffic', 'Look for POST requests']
  },
  {
    title: 'Linux Privilege Escalation',
    description: 'You have a low-privilege shell on a Linux system. Find the misconfigured SUID binary and escalate to root.',
    category: 'linux',
    difficulty: 'hard',
    points: 200,
    flag: 'FLAG{r00t_pr1v3sc_pwn3d}',
    hints: ['Use find to locate SUID binaries', 'Check GTFOBins', 'Look for writable scripts run by root']
  },
  {
    title: 'Base64 Secrets',
    description: 'A message has been encoded multiple times. Decode it layer by layer to reveal the hidden flag.',
    category: 'forensics',
    difficulty: 'easy',
    points: 30,
    flag: 'FLAG{d3c0d3_4ll_th3_l4y3rs}',
    hints: ['Start with base64 decode', 'Repeat until you see FLAG{']
  },
  {
    title: 'Directory Traversal',
    description: 'The web application fails to sanitize file paths. Traverse the directory structure to read /etc/passwd.',
    category: 'web',
    difficulty: 'medium',
    points: 100,
    flag: 'FLAG{p4th_tr4v3rs4l_pwn}',
    hints: ['Try ../../../etc/passwd', 'URL encode the dots']
  },
  {
    title: 'Linux File Permissions',
    description: 'A sensitive file is hidden somewhere on the system with unusual permissions. Find it and read its contents.',
    category: 'linux',
    difficulty: 'easy',
    points: 50,
    flag: 'FLAG{l1nux_p3rm1ss10ns_101}',
    hints: ['Use find with permission flags', 'Check hidden directories']
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const c of challenges) {
      const slug = slugify(c.title);
      await Challenge.findOneAndUpdate(
        { title: c.title },
        { $set: { ...c, slug } },
        { upsert: true, runValidators: true }
      );
      console.log(`  ✓ ${c.title}`);
    }

    console.log(`\nUpserted ${challenges.length} challenges successfully!`);
    mongoose.connection.close();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seed();
