const express = require('express');
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const requireStaff = require('../middleware/requireStaff');
const requireAdmin = require('../middleware/requireAdmin');
const Challenge = require('../models/Challenge');
const Lab = require('../models/Lab');
const LabSession = require('../models/LabSession');
const LabProgress = require('../models/LabProgress');
const User = require('../models/User');
const { getPublicFlags } = require('../utils/labHelpers');
const { normalizeDockerfile } = require('../utils/dockerfileNormalize');
const rateLimit = require('express-rate-limit');
const { chatJSON, chatCompletion } = require('../utils/aiHelpers');
const blockDuringExam = require('../middleware/blockDuringExam');

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Rate limit AI requests
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many AI requests, please wait a minute.' }
});

const publicAiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many AI requests, please wait a minute.' }
});

// Get AI hint for a challenge
router.post('/hint', auth, blockDuringExam, aiLimiter, async (req, res) => {
  try {
    const { challengeId, userMessage, conversationHistory } = req.body;

    const challenge = await Challenge.findById(challengeId).select('-flag');
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const systemPrompt = `You are CyberBot, an expert cybersecurity mentor on CyberLab platform. 
You are helping a student with this challenge:

Title: ${challenge.title}
Category: ${challenge.category}
Difficulty: ${challenge.difficulty}
Description: ${challenge.description}
Hints available: ${challenge.hints?.join(', ')}

Your rules:
- NEVER reveal the flag directly
- Give progressive hints that guide thinking
- Explain concepts clearly for beginners
- Suggest specific tools and techniques
- Be encouraging and educational
- Keep responses concise (max 150 words)
- Use simple language
- If asked for the flag directly, refuse and give a hint instead`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userMessage }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 200,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      message: aiResponse,
      role: 'assistant'
    });

  } catch (err) {
    console.error('Groq error:', err.message);
    res.status(500).json({ message: err.message || 'AI service unavailable' });
  }
});

// AI Lab Mentor — contextual tutoring beyond static hints
router.post('/lab-mentor', auth, blockDuringExam, aiLimiter, async (req, res) => {
  try {
    const { labId, userMessage, conversationHistory, recentTerminal } = req.body;

    if (!labId || !userMessage?.trim()) {
      return res.status(400).json({ message: 'Lab and message required' });
    }

    const lab = await Lab.findById(labId).select('-flag -flags.flag -walkthrough');
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    const [progress, session, user] = await Promise.all([
      LabProgress.findOne({ user: req.user.userId, lab: labId }),
      LabSession.findOne({ user: req.user.userId, lab: labId, status: 'running' }),
      User.findById(req.user.userId).select('username level xp currentTrack careerPath')
    ]);

    const solvedKeys = progress?.solvedFlagKeys || [];
    const flagObjectives = getPublicFlags(lab).map(f => ({
      label: f.label,
      points: f.points,
      solved: solvedKeys.includes(f.key)
    }));

    const hintsUnlocked = (lab.hints || [])
      .slice(0, progress?.hintsRevealed || 0)
      .map((h, i) => `Hint ${i + 1}: ${h}`);

    const tasks = (lab.tasks || []).map((t, i) =>
      `Task ${i + 1}: ${t.title} — ${t.description || 'No description'}`
    );

    const terminalContext = Array.isArray(recentTerminal) && recentTerminal.length
      ? recentTerminal.slice(-12).join('\n')
      : null;

    const systemPrompt = `You are Lab Mentor, an expert hands-on cybersecurity instructor on CyberLab.
You tutor students through LIVE hacking labs — going far beyond static hints.

== LAB ==
Title: ${lab.title}
Category: ${lab.category} | Difficulty: ${lab.difficulty} | Points: ${lab.points}
Description: ${lab.description}
Estimated time: ${lab.estimatedTime || 30} minutes
Recommended tools: ${(lab.tools || []).join(', ') || 'General CLI tools'}
MITRE tags: ${(lab.mitreTags || []).join(', ') || 'N/A'}

== OBJECTIVES ==
${flagObjectives.map(f => `- ${f.label} (${f.points} pts) — ${f.solved ? 'CAPTURED' : 'not yet captured'}`).join('\n')}

== TASKS ==
${tasks.length ? tasks.join('\n') : 'No structured tasks — follow the description.'}

== STUDENT PROGRESS ==
Flags captured: ${solvedKeys.length}/${flagObjectives.length}
Hints unlocked: ${progress?.hintsRevealed || 0}/${lab.hints?.length || 0}
${hintsUnlocked.length ? `Unlocked hints (build on these, do not repeat verbatim):\n${hintsUnlocked.join('\n')}` : 'No hints unlocked yet.'}
Lab session: ${session ? 'RUNNING (VM active)' : 'NOT RUNNING (student may need to start the lab)'}
Active time: ~${Math.floor((progress?.totalActiveSeconds || 0) / 60)} min
Student level: ${user?.level || 1} | Track: ${user?.currentTrack || 'beginner'}

${terminalContext ? `== RECENT TERMINAL OUTPUT (analyze for debugging) ==\n${terminalContext}` : ''}

== YOUR ROLE ==
- Diagnose WHY approaches fail (wrong syntax, wrong parameter, encoding, permissions, wrong service, etc.)
- Explain underlying concepts clearly (e.g. SQLi types, privesc paths, XSS context)
- Suggest concrete debugging steps: what to verify, what command to try, what output to expect
- If they paste errors or commands, analyze those specifically
- Guide toward the next unsolved objective without spoiling solved ones
- Use Socratic teaching — ask what they tried, then narrow the problem

== STRICT RULES ==
- NEVER reveal flag values or FLAG{...} strings
- NEVER give copy-paste payloads that directly yield the flag
- Do not quote the walkthrough or full solutions
- If asked for the flag directly, refuse and teach the next debugging step instead
- Keep responses under 220 words unless analyzing pasted terminal output
- Be encouraging and precise`;

    const history = (conversationHistory || []).slice(-10);
    const reply = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage.trim() }
      ],
      { maxTokens: 350, temperature: 0.65 }
    );

    res.json({ message: reply, role: 'assistant' });
  } catch (err) {
    console.error('Lab mentor error:', err.message);
    res.status(500).json({ message: err.message || 'Lab Mentor unavailable' });
  }
});

const generalCyberPrompt = `You are CyberBot, a friendly cybersecurity education mentor on CyberLab — a university cybersecurity training platform for students.

Your purpose is to teach ethical hacking, penetration testing, and cybersecurity defense.

Guidelines:
- Answer all cybersecurity education questions helpfully
- Explain concepts like SQL injection, XSS, network scanning clearly
- Recommend learning resources, certifications, and career paths
- Suggest tools used in ethical hacking (Burp Suite, Nmap, Wireshark etc)
- Be encouraging to beginners
- Keep responses concise (max 200 words)
- All topics are for educational and ethical purposes only
- Never assist with attacking real systems without permission
- If asked "how do I start hacking" — give a proper beginner roadmap`;

// Public cybersecurity Q&A (no auth — for guests)
router.post('/public-ask', publicAiLimiter, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ message: 'Question required' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: generalCyberPrompt },
        { role: 'user', content: question.trim() }
      ],
      max_tokens: 250,
      temperature: 0.7
    });

    res.json({ message: completion.choices[0].message.content });
  } catch (err) {
    console.error('Groq error:', err.message);
    res.status(500).json({ message: 'AI service unavailable' });
  }
});

// General cybersecurity question (authenticated)
router.post('/ask', auth, blockDuringExam, aiLimiter, async (req, res) => {
  try {
    const { question } = req.body;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: generalCyberPrompt },
        { role: 'user', content: question }
      ],
      max_tokens: 250,
      temperature: 0.7
    });

    res.json({
      message: completion.choices[0].message.content
    });

  } catch (err) {
    console.error('Groq error:', err.message);
    res.status(500).json({ message: 'AI service unavailable' });
  }
});

// Personalized chat — aware of user account, progress, labs, challenges
router.post('/chat', auth, blockDuringExam, aiLimiter, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    // Fetch live user data
    const user = await User.findById(req.user.userId)
      .populate('solvedChallenges', 'title category difficulty points');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Completed labs
    const completedSessions = await LabSession.find({
      user: req.user.userId,
      flagSubmitted: true
    }).populate('lab', 'title category difficulty points');

    // All available labs to derive what's remaining
    const allLabs = await Lab.find({ isActive: true }).select('title category difficulty points');

    const completedLabIds = completedSessions
      .filter(s => s.lab)
      .map(s => s.lab._id.toString());

    const completedLabs = completedSessions
      .filter(s => s.lab)
      .map(s => `${s.lab.title} (${s.lab.category}, ${s.lab.difficulty})`);

    const remainingLabs = allLabs
      .filter(l => !completedLabIds.includes(l._id.toString()))
      .map(l => `${l.title} (${l.category}, ${l.difficulty}, ${l.points}pts)`);

    const solvedChallenges = (user.solvedChallenges || [])
      .map(c => `${c.title} (${c.category}, ${c.difficulty})`);

    // Derive weak areas from what categories are unsolved
    const labCategories = ['web', 'network', 'linux', 'crypto', 'forensics'];
    const completedCategories = [
      ...completedSessions.filter(s => s.lab).map(s => s.lab.category),
      ...(user.solvedChallenges || []).map(c => c.category)
    ];
    const weakAreas = labCategories.filter(
      cat => !completedCategories.includes(cat)
    );

    const systemPrompt = `You are CyberBot, a personalized AI cybersecurity mentor on CyberLab — an interactive hacking training platform.

== STUDENT PROFILE ==
Name: ${user.username}
Level: ${user.level}
XP: ${user.xp}
Points: ${user.points}
Career Path: ${user.careerPath}
Learning Track: ${user.currentTrack}
Daily Streak: ${user.dailyStreak} days

== COMPLETED LABS (${completedLabs.length}) ==
${completedLabs.length > 0 ? completedLabs.join('\n') : 'None yet'}

== SOLVED CHALLENGES (${solvedChallenges.length}) ==
${solvedChallenges.length > 0 ? solvedChallenges.join('\n') : 'None yet'}

== REMAINING LABS (${remainingLabs.length} left) ==
${remainingLabs.join('\n')}

== WEAK AREAS ==
${weakAreas.length > 0 ? weakAreas.join(', ') : 'None — great coverage!'}

== YOUR ROLE ==
- You know this student personally. Reference their stats and progress naturally.
- Recommend specific labs/challenges from the remaining list that match their level and gaps.
- If they are a beginner (level 1–3), push easy labs first.
- If they ask "what should I do next?", suggest the most relevant remaining lab with a reason.
- Celebrate completed work — mention their streak, points, or level when encouraging.
- NEVER reveal flags.
- Keep responses concise (max 200 words).
- Be direct, friendly, and motivating.`;

    const history = (conversationHistory || []).slice(-10);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    res.json({ message: completion.choices[0].message.content });

  } catch (err) {
    console.error('Groq chat error:', err.message);
    res.status(500).json({ message: 'AI service unavailable' });
  }
});

// ── AI Lab Generator (admin) — metadata + Dockerfile + files ─────────────────
router.post('/generate-lab', auth, requireAdmin, aiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ message: 'Describe the hacking lab you want to create' });
    }

    const systemPrompt = `You are a CyberLab hacking lab architect. Generate a complete hands-on lab with a working Dockerfile.
Students run the lab in Docker with a web UI on port 80 and/or a bash terminal.

You MUST respond with a single valid JSON object only. No markdown outside JSON.
For Dockerfile content: use \\n for newlines inside the JSON string (never raw line breaks in strings).

JSON structure:
{
  "slug": "lowercase-hyphen-name",
  "title": "string",
  "description": "string — scenario for students",
  "category": "web|network|linux|forensics|crypto",
  "difficulty": "easy|medium|hard",
  "points": 100,
  "flag": "FLAG{...}",
  "estimatedTime": 30,
  "labType": "web|linux-cli|network",
  "dockerImage": "cyberlab-slug-name",
  "tasks": [{"title":"string","description":"string","hint":"string","points":number}],
  "tools": ["tool1","tool2"],
  "hints": ["hint1","hint2","hint3"],
  "mitreTags": ["T1190"],
  "walkthrough": {"content":"string","steps":["step1"],"tools":["tool1"]},
  "files": [{"path":"Dockerfile","content":"full Dockerfile with \\\\n line breaks"}]
}

DOCKERFILE RULES BY labType:
- web: MUST use this pattern (never multiline RUN echo):
  FROM php:7.4-apache
  RUN apt-get update && apt-get install -y python3-minimal && rm -rf /var/lib/apt/lists/*
  RUN python3 - << 'PYEOF'
  php = r"""<?php ... ?>"""
  open('/var/www/html/index.php', 'w').write(php)
  PYEOF
  RUN echo "FLAG{...}" > /root/flag.txt
  EXPOSE 80
- linux-cli: FROM ubuntu:22.04, install basic tools, plant flag in hidden path, decoy files, WORKDIR /home/hacker, CMD ["/bin/bash"]
- network: FROM ubuntu:22.04, create capture/log files under /home/analyst/captures with FLAG in data, CMD ["/bin/bash"]

DOCKERFILE SAFETY:
- NEVER use RUN echo for PHP, HTML, or JavaScript — always use python3 heredoc for EVERY file write
- Put all files (index.php, search.html, etc.) in separate python3 PYEOF blocks — never RUN echo
- PHP variables MUST start with $ (e.g. $q = $_GET["q"]; never search_query = $_GET)
- Web XSS labs should use one complete index.php with HTML form + reflected output like CyberLab search portal
- No privileged mode, no host mounts, no downloading remote scripts
- Educational vulnerabilities only (SQLi, XSS, cmd injection, LFI, enum, privesc simulation)
- Keep images small — minimal apt packages
- Use RUN echo or python3 heredoc for PHP files (see CyberLab patterns)

slug must match dockerImage suffix (cyberlab-{slug}).
Generate 3 tasks with hints and point values summing to ~points.
Flag must appear inside the container (web page, file, or capture data).`;

    const draft = await chatJSON(systemPrompt, prompt.trim(), { maxTokens: 4500, temperature: 0.55 });

    const validCategories = ['web', 'network', 'linux', 'forensics', 'crypto'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    const slug = String(draft.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '').slice(0, 48);

    if (!slug || !draft.title || !draft.files?.length) {
      return res.status(500).json({ message: 'AI generated incomplete lab — try again with a clearer prompt' });
    }

    const dockerfile = draft.files.find(f => f.path === 'Dockerfile');
    if (!dockerfile?.content) {
      return res.status(500).json({ message: 'AI did not generate a Dockerfile — try again' });
    }

    // Unescape \\n in file contents from JSON; normalize Dockerfile for valid builds
    const files = draft.files.map(f => {
      let content = String(f.content).replace(/\\n/g, '\n');
      if ((f.path || 'Dockerfile') === 'Dockerfile') {
        content = normalizeDockerfile(content);
      }
      return { path: f.path || 'Dockerfile', content };
    });

    res.json({
      draft: {
        slug,
        title: String(draft.title).trim(),
        description: String(draft.description || '').trim(),
        category: validCategories.includes(draft.category) ? draft.category : 'web',
        difficulty: validDifficulties.includes(draft.difficulty) ? draft.difficulty : 'medium',
        points: Math.min(500, Math.max(50, parseInt(draft.points, 10) || 100)),
        flag: String(draft.flag || `FLAG{${slug}}`).trim(),
        estimatedTime: Math.min(120, Math.max(10, parseInt(draft.estimatedTime, 10) || 30)),
        dockerImage: `cyberlab-${slug}`,
        labType: draft.labType || 'web',
        tasks: Array.isArray(draft.tasks) ? draft.tasks : [],
        tools: Array.isArray(draft.tools) ? draft.tools.map(String) : [],
        hints: Array.isArray(draft.hints) ? draft.hints.map(String) : [],
        mitreTags: Array.isArray(draft.mitreTags) ? draft.mitreTags.map(String) : [],
        walkthrough: draft.walkthrough || {},
        files
      }
    });
  } catch (err) {
    console.error('Generate lab error:', err.message);
    res.status(500).json({ message: err.message || 'AI lab generation failed' });
  }
});

// ── AI Challenge Generator (staff) ───────────────────────────────────────────
router.post('/generate-challenge', auth, requireStaff, aiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ message: 'Describe the challenge you want to create' });
    }

    const systemPrompt = `You are a CTF challenge author for CyberLab, a university cybersecurity training platform.
Generate a complete, educational CTF challenge from the instructor's request.

You MUST respond with a single valid JSON object only. No markdown, no commentary.
All string values must be on one line — use spaces instead of line breaks inside strings.

Required JSON structure:
{
  "title": "string",
  "description": "string — scenario and objectives in 2-4 sentences",
  "category": "web|network|linux|forensics",
  "difficulty": "easy|medium|hard",
  "points": 50,
  "flag": "FLAG{...}",
  "hints": ["hint1", "hint2", "hint3"],
  "writeup": {
    "content": "string — full solution explanation as one paragraph",
    "steps": ["step1", "step2"],
    "tools": ["tool1", "tool2"]
  }
}

Rules:
- Flag must use FLAG{...} format
- Hints must be progressive (never reveal the flag)
- Writeup is for students after they solve — include clear steps
- Content must be ethical and educational only
- Never put raw newline characters inside JSON string values`;

    const draft = await chatJSON(systemPrompt, prompt.trim(), { maxTokens: 2000, temperature: 0.6 });

    const validCategories = ['web', 'network', 'linux', 'forensics'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    if (!draft.title || !draft.description || !draft.flag) {
      return res.status(500).json({ message: 'AI generated incomplete challenge — try again' });
    }

    res.json({
      draft: {
        title: String(draft.title).trim(),
        description: String(draft.description).trim(),
        category: validCategories.includes(draft.category) ? draft.category : 'web',
        difficulty: validDifficulties.includes(draft.difficulty) ? draft.difficulty : 'medium',
        points: Math.min(500, Math.max(50, parseInt(draft.points, 10) || 100)),
        flag: String(draft.flag).trim(),
        hints: Array.isArray(draft.hints) ? draft.hints.map(h => String(h).trim()).filter(Boolean) : [],
        writeup: {
          content: draft.writeup?.content ? String(draft.writeup.content) : '',
          steps: Array.isArray(draft.writeup?.steps) ? draft.writeup.steps.map(s => String(s)) : [],
          tools: Array.isArray(draft.writeup?.tools) ? draft.writeup.tools.map(t => String(t)) : [],
          author: 'CyberLab Team'
        }
      }
    });
  } catch (err) {
    console.error('Generate challenge error:', err.message);
    res.status(500).json({ message: err.message || 'AI generation failed' });
  }
});

// ── AI Writeup Reviewer ──────────────────────────────────────────────────────
router.post('/review-writeup', auth, blockDuringExam, aiLimiter, async (req, res) => {
  try {
    const { challengeId, title, content } = req.body;
    if (!challengeId || !content?.trim()) {
      return res.status(400).json({ message: 'Challenge and writeup content required' });
    }

    const user = await User.findById(req.user.userId);
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!user.solvedChallenges.map(id => id.toString()).includes(challengeId)) {
      return res.status(403).json({ message: 'Solve the challenge first to review your writeup' });
    }

    const systemPrompt = `You are an expert cybersecurity educator reviewing student CTF writeups on CyberLab.
Evaluate the writeup for technical accuracy, clarity, completeness, and educational value.
Be constructive and specific. Do not reveal the challenge flag.

Return ONLY valid JSON:
{
  "accuracy": number (1-10),
  "clarity": number (1-10),
  "overallScore": number (1-10),
  "missingSteps": ["step or concept missing", ...],
  "improvements": ["specific suggestion", ...],
  "summary": "2-3 sentence overall feedback"
}`;

    const officialContext = challenge.writeup?.content
      ? `Official solution reference (internal — do not quote verbatim to student):\n${challenge.writeup.content}\nSteps: ${(challenge.writeup.steps || []).join('; ')}`
      : 'No official writeup on file — judge based on challenge description and standard techniques.';

    const userPrompt = `Challenge: ${challenge.title}
Category: ${challenge.category} | Difficulty: ${challenge.difficulty}
Description: ${challenge.description}

${officialContext}

Student writeup title: ${title || 'Untitled'}
Student writeup:
${content.trim()}`;

    const review = await chatJSON(systemPrompt, userPrompt, { maxTokens: 800, temperature: 0.3 });

    res.json({
      review: {
        accuracy: Math.min(10, Math.max(1, Number(review.accuracy) || 5)),
        clarity: Math.min(10, Math.max(1, Number(review.clarity) || 5)),
        overallScore: Math.min(10, Math.max(1, Number(review.overallScore) || 5)),
        missingSteps: Array.isArray(review.missingSteps) ? review.missingSteps : [],
        improvements: Array.isArray(review.improvements) ? review.improvements : [],
        summary: review.summary || 'Review complete.'
      }
    });
  } catch (err) {
    console.error('Review writeup error:', err.message);
    res.status(500).json({ message: err.message || 'AI review failed' });
  }
});

// ── AI SOC Assistant (blue team) ─────────────────────────────────────────────
const socSystemPrompt = `You are SOC Analyst AI on CyberLab — a blue-team focused cybersecurity assistant.

You specialize in:
- Log analysis (Windows Event IDs, Sysmon, firewall, proxy, IDS/IPS, EDR alerts)
- Incident response (triage, containment, eradication, recovery, communication)
- Threat hunting (hypothesis-driven hunting, IOC correlation, MITRE ATT&CK mapping)

Guidelines:
- Think and respond like a defender, not an attacker
- Reference real SOC tools: Splunk, Elastic SIEM, Microsoft Sentinel, CrowdStrike, QRadar, Wireshark, Volatility
- When logs are pasted, structure analysis: Timeline → Suspicious indicators → MITRE mapping → Next steps
- Suggest concrete search queries (KQL, SPL, Sigma-style logic) when helpful
- Map findings to MITRE ATT&CK techniques where relevant
- All guidance is for defensive security on authorized systems only
- Keep responses focused (max 300 words unless analyzing provided logs)`;

router.post('/soc', auth, blockDuringExam, aiLimiter, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message required' });
    }

    const history = (conversationHistory || []).slice(-10);
    const reply = await chatCompletion(
      [
        { role: 'system', content: socSystemPrompt },
        ...history,
        { role: 'user', content: message.trim() }
      ],
      { maxTokens: 400, temperature: 0.5 }
    );

    res.json({ message: reply });
  } catch (err) {
    console.error('SOC assistant error:', err.message);
    res.status(500).json({ message: err.message || 'AI service unavailable' });
  }
});

module.exports = router;