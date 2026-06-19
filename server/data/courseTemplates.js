const crypto = require('crypto');

const modId = () => crypto.randomBytes(4).toString('hex');

const WEB_APP_SECURITY = {
  title: 'Web Application Security',
  description: 'A complete instructor-led course covering HTTP fundamentals, OWASP risks, hands-on SQLi labs, and a final assessment with certificate.',
  category: 'web',
  icon: '🌐',
  color: '#3fb950',
  certificateTitle: 'Web Application Security — Course Certificate',
  modules: [
    {
      id: modId(),
      type: 'lesson',
      title: 'Lesson 1: HTTP & the Web Attack Surface',
      description: 'How browsers, servers, and proxies interact — and where attackers probe first.',
      order: 1,
      lessonContent: 'Web application security starts with understanding HTTP: requests, responses, headers, cookies, and sessions. Every input field, URL parameter, header, and API endpoint is potential attack surface.',
      lessonBullets: [
        'Map GET/POST parameters and hidden form fields',
        'Use a proxy (Burp/ZAP) to inspect traffic',
        'Identify authentication and session mechanisms',
        'Document findings before exploitation'
      ],
      videoYoutubeId: 'zv0XoLj7q-8',
      estimatedMinutes: 45
    },
    {
      id: modId(),
      type: 'lesson',
      title: 'Lesson 2: OWASP Top 10 & Injection Flaws',
      description: 'SQLi, XSS, and broken access control — the vulnerabilities you will see in every pentest.',
      order: 2,
      lessonContent: 'The OWASP Top 10 prioritizes the most critical web risks. Injection flaws remain at the top because user input still reaches interpreters (SQL, OS, LDAP) without proper parameterization.',
      lessonBullets: [
        'Understand SQL injection logic bypass',
        'Differentiate reflected vs stored XSS',
        'Test access control on every role',
        'Never trust client-side validation alone'
      ],
      estimatedMinutes: 50
    },
    {
      id: modId(),
      type: 'quiz',
      title: 'Quiz: Web Security Fundamentals',
      description: 'Check your understanding before the hands-on lab.',
      order: 3,
      passThreshold: 70,
      estimatedMinutes: 20,
      questions: [
        {
          question: 'Which HTTP header is commonly used to carry session tokens?',
          options: ['Content-Type', 'Set-Cookie / Cookie', 'User-Agent', 'Accept-Encoding'],
          correctIndex: 1,
          explanation: 'Sessions are typically tracked via cookies set by Set-Cookie and sent back in Cookie.'
        },
        {
          question: 'What is the primary fix for SQL Injection?',
          options: ['Input blacklists', 'Parameterized queries', 'Longer passwords', 'HTTPS only'],
          correctIndex: 1,
          explanation: 'Prepared statements / parameterized queries separate code from data.'
        },
        {
          question: 'Reflected XSS differs from stored XSS because:',
          options: [
            'It only affects the server database',
            'The payload is immediately echoed in the response to the victim',
            'It requires root access',
            'It cannot steal cookies'
          ],
          correctIndex: 1,
          explanation: 'Reflected XSS appears in the immediate HTTP response; stored XSS persists in the app.'
        },
        {
          question: 'A WAF block means the application is:',
          options: ['Fully patched', 'Safe from all attacks', 'Still potentially vulnerable behind the WAF', 'Using prepared statements'],
          correctIndex: 2,
          explanation: 'WAFs are a layer of defense; underlying flaws may still exist.'
        }
      ]
    },
    {
      id: modId(),
      type: 'lab',
      title: 'Lab: SQL Injection Attack',
      description: 'Hands-on lab — find the injection point and extract the flag.',
      order: 4,
      estimatedMinutes: 60,
      lab: null
    },
    {
      id: modId(),
      type: 'exam',
      title: 'Final Exam: Web Application Security',
      description: 'Comprehensive assessment — 70% required to pass and unlock your certificate.',
      order: 5,
      passThreshold: 70,
      estimatedMinutes: 45,
      questions: [
        {
          question: 'Which payload pattern tests for SQL injection in a login form?',
          options: ["admin' OR '1'='1' --", '<script>alert(1)</script>', '../../../etc/passwd', '; ls -la'],
          correctIndex: 0,
          explanation: "Classic SQLi tautology bypasses authentication checks."
        },
        {
          question: 'DOM-based XSS executes entirely in:',
          options: ['The database', 'The browser JavaScript context', 'The WAF', 'DNS'],
          correctIndex: 1,
          explanation: 'DOM XSS never needs the server to reflect the payload in HTML.'
        },
        {
          question: 'IDOR (Insecure Direct Object Reference) is a failure of:',
          options: ['Encryption', 'Access control', 'DNS', 'Logging'],
          correctIndex: 1,
          explanation: 'IDOR lets users access objects they should not by manipulating references.'
        },
        {
          question: 'Before reporting SQLi in a client engagement you should:',
          options: [
            'DROP production tables to prove impact',
            'Demonstrate safe, minimal proof of data access or auth bypass',
            'Publish findings on social media',
            'Only test production at night'
          ],
          correctIndex: 1,
          explanation: 'Professional testing uses minimal proof without destructive impact.'
        },
        {
          question: 'Content Security Policy (CSP) primarily mitigates:',
          options: ['SQL injection', 'XSS by restricting script sources', 'DDoS', 'Weak passwords'],
          correctIndex: 1,
          explanation: 'CSP limits where scripts can load and execute from.'
        }
      ]
    },
    {
      id: modId(),
      type: 'certificate',
      title: 'Certificate of Completion',
      description: 'Awarded when all lessons, quiz, lab, and final exam are complete.',
      order: 6,
      estimatedMinutes: 5
    }
  ]
};

module.exports = { WEB_APP_SECURITY };
