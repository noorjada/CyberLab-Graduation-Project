import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import './Terminal.css';

const FILESYSTEM = {
  '/': ['home', 'etc', 'var', 'tmp'],
  '/home': ['user'],
  '/home/user': ['documents', 'downloads', 'secret.txt', 'notes.txt'],
  '/home/user/documents': ['report.txt', 'passwords.txt'],
  '/home/user/downloads': ['tool.py', 'exploit.sh'],
  '/etc': ['passwd', 'hosts', 'shadow', 'crontab'],
  '/var': ['log'],
  '/var/log': ['auth.log', 'syslog'],
  '/tmp': ['temp.txt']
};

const FILECONTENTS = {
  '/home/user/secret.txt': 'FLAG{l1nux_t3rm1n4l_m4st3r}\nThis is a secret file!',
  '/home/user/notes.txt': 'Remember to check /etc/passwd for users\nAlways use strong passwords!',
  '/home/user/documents/report.txt': 'Monthly security report\nDate: 2024-01-15\nStatus: All systems operational',
  '/home/user/documents/passwords.txt': 'Do not store passwords in plaintext!\nhashed: $2b$12$abc123...',
  '/home/user/downloads/tool.py': '#!/usr/bin/env python3\n# Security scanning tool\nprint("Scanning...")',
  '/home/user/downloads/exploit.sh': '#!/bin/bash\n# Educational exploit script\necho "Running exploit..."',
  '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33::/var/www:/bin/sh\nuser:x:1000:1000::/home/user:/bin/bash',
  '/etc/hosts': '127.0.0.1 localhost\n192.168.1.1 router\n10.0.0.1 target.lab',
  '/etc/shadow': 'root:$6$random$hashedpassword:18000:0:99999:7:::\nuser:$6$salt$hash:18000:0:99999:7:::',
  '/etc/crontab': '*/5 * * * * root /usr/bin/backup.sh\n0 2 * * * www-data /var/www/cleanup.py',
  '/var/log/auth.log': 'Jan 15 10:23:11 server sshd: Failed password for root\nJan 15 10:23:45 server sshd: Accepted password for user',
  '/var/log/syslog': 'Jan 15 10:00:01 server CRON: job started\nJan 15 10:05:01 server CRON: backup completed',
  '/tmp/temp.txt': 'Temporary file - will be deleted on reboot'
};

const TerminalPage = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [currentDir, setCurrentDir] = useState('/home/user');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const currentDirRef = useRef('/home/user');
  const inputRef = useRef('');
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selection: '#1f6feb40',
        black: '#0d1117',
        green: '#3fb950',
        yellow: '#f0c040',
        blue: '#58a6ff',
        red: '#f85149',
        cyan: '#76e3ea',
        white: '#c9d1d9',
        brightGreen: '#56d364',
        brightBlue: '#79c0ff',
      },
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
      lineHeight: 1.4,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    setTimeout(() => fitAddon.fit(), 100);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;36m╔═══════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║     CyberLab Terminal Emulator        ║\x1b[0m');
    term.writeln('\x1b[1;36m║     Practice Linux commands safely    ║\x1b[0m');
    term.writeln('\x1b[1;36m╚═══════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[32mType "help" to see available commands\x1b[0m');
    term.writeln('\x1b[33mFind the hidden flag to earn points!\x1b[0m');
    term.writeln('');

    writePrompt(term);

    term.onKey(({ key, domEvent }) => {
      const code = domEvent.keyCode;

      if (code === 13) {
        term.writeln('');
        const cmd = inputRef.current.trim();
        if (cmd) {
          commandHistoryRef.current = [cmd, ...commandHistoryRef.current];
          historyIndexRef.current = -1;
          handleCommand(term, cmd);
        } else {
          writePrompt(term);
        }
        inputRef.current = '';
      } else if (code === 8) {
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code === 38) {
        if (commandHistoryRef.current.length > 0) {
          historyIndexRef.current = Math.min(
            historyIndexRef.current + 1,
            commandHistoryRef.current.length - 1
          );
          const cmd = commandHistoryRef.current[historyIndexRef.current];
          clearInput(term);
          inputRef.current = cmd;
          term.write(cmd);
        }
      } else if (code === 40) {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const cmd = commandHistoryRef.current[historyIndexRef.current];
          clearInput(term);
          inputRef.current = cmd;
          term.write(cmd);
        } else {
          historyIndexRef.current = -1;
          clearInput(term);
          inputRef.current = '';
        }
      } else if (code === 9) {
        domEvent.preventDefault();
        handleTabComplete(term);
      } else if (key.length === 1) {
        inputRef.current += key;
        term.write(key);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const clearInput = (term) => {
    term.write('\b \b'.repeat(inputRef.current.length));
  };

  const writePrompt = (term) => {
    const dir = currentDirRef.current;
    const shortDir = dir === '/home/user' ? '~' : dir.replace('/home/user', '~');
    term.write(`\x1b[1;32muser@cyberlab\x1b[0m:\x1b[1;34m${shortDir}\x1b[0m$ `);
  };

  const handleTabComplete = (term) => {
    const input = inputRef.current;
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];
    const contents = FILESYSTEM[currentDirRef.current] || [];
    const matches = contents.filter(f => f.startsWith(lastPart));
    if (matches.length === 1) {
      const completion = matches[0].slice(lastPart.length);
      inputRef.current += completion;
      term.write(completion);
    } else if (matches.length > 1) {
      term.writeln('');
      term.writeln(matches.join('  '));
      writePrompt(term);
      term.write(inputRef.current);
    }
  };

  const resolvePath = (path) => {
    if (path.startsWith('/')) return path;
    if (path === '..') {
      const parts = currentDirRef.current.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/') || '/';
    }
    if (path === '.') return currentDirRef.current;
    if (path === '~') return '/home/user';
    return currentDirRef.current === '/'
      ? `/${path}`
      : `${currentDirRef.current}/${path}`;
  };

  const handleCommand = (term, input) => {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        term.writeln('\x1b[1;33mAvailable commands:\x1b[0m');
        term.writeln('  \x1b[36mls\x1b[0m              - list directory contents');
        term.writeln('  \x1b[36mcd <dir>\x1b[0m        - change directory');
        term.writeln('  \x1b[36mpwd\x1b[0m             - print working directory');
        term.writeln('  \x1b[36mcat <file>\x1b[0m      - display file contents');
        term.writeln('  \x1b[36mecho <text>\x1b[0m     - display text');
        term.writeln('  \x1b[36mfind <name>\x1b[0m     - find files');
        term.writeln('  \x1b[36mgrep <pat> <file>\x1b[0m - search in file');
        term.writeln('  \x1b[36mwhoami\x1b[0m          - current user');
        term.writeln('  \x1b[36mhistory\x1b[0m         - command history');
        term.writeln('  \x1b[36muname\x1b[0m           - system info');
        term.writeln('  \x1b[36mifconfig\x1b[0m        - network info');
        term.writeln('  \x1b[36mps\x1b[0m              - running processes');
        term.writeln('  \x1b[36mfile <name>\x1b[0m     - file type info');
        term.writeln('  \x1b[36mbase64 <text>\x1b[0m   - encode to base64');
        term.writeln('  \x1b[36mclear\x1b[0m           - clear terminal');
        term.writeln('');
        term.writeln('\x1b[33mTip: Use Tab for autocomplete, ↑↓ for history\x1b[0m');
        break;

      case 'ls':
        const lsDir = args[0] ? resolvePath(args[0]) : currentDirRef.current;
        const contents = FILESYSTEM[lsDir];
        if (!contents) {
          term.writeln(`\x1b[31mls: cannot access '${args[0]}': No such file or directory\x1b[0m`);
        } else {
          const formatted = contents.map(item => {
            const fullPath = lsDir === '/' ? `/${item}` : `${lsDir}/${item}`;
            const isDir = FILESYSTEM[fullPath] !== undefined;
            return isDir
              ? `\x1b[1;34m${item}\x1b[0m`
              : item.endsWith('.sh') || item.endsWith('.py')
                ? `\x1b[1;32m${item}\x1b[0m`
                : item;
          });
          term.writeln(formatted.join('  '));
        }
        break;

      case 'cd':
        const target = args[0] || '/home/user';
        const newPath = resolvePath(target);
        if (FILESYSTEM[newPath] !== undefined) {
          currentDirRef.current = newPath;
          setCurrentDir(newPath);
        } else {
          term.writeln(`\x1b[31mcd: ${target}: No such file or directory\x1b[0m`);
        }
        break;

      case 'pwd':
        term.writeln(currentDirRef.current);
        break;

      case 'cat':
        if (!args[0]) {
          term.writeln('\x1b[31mcat: missing operand\x1b[0m');
        } else {
          const filePath = resolvePath(args[0]);
          const content = FILECONTENTS[filePath];
          if (content) {
            content.split('\n').forEach(line => term.writeln(line));
          } else if (FILESYSTEM[filePath]) {
            term.writeln(`\x1b[31mcat: ${args[0]}: Is a directory\x1b[0m`);
          } else {
            term.writeln(`\x1b[31mcat: ${args[0]}: No such file or directory\x1b[0m`);
          }
        }
        break;

      case 'echo':
        term.writeln(args.join(' '));
        break;

      case 'whoami':
        term.writeln('user');
        break;

      case 'uname':
        term.writeln('Linux cyberlab 5.15.0-cyberlab #1 SMP x86_64 GNU/Linux');
        break;

      case 'ifconfig':
        term.writeln('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500');
        term.writeln('        inet \x1b[33m10.0.0.5\x1b[0m  netmask 255.255.255.0  broadcast 10.0.0.255');
        term.writeln('        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>');
        term.writeln('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536');
        term.writeln('        inet \x1b[33m127.0.0.1\x1b[0m  netmask 255.0.0.0');
        break;

      case 'ps':
        term.writeln('  PID TTY          TIME CMD');
        term.writeln(' 1234 pts/0    00:00:00 bash');
        term.writeln(' 1337 pts/0    00:00:01 apache2');
        term.writeln(' 2048 pts/0    00:00:00 mysql');
        term.writeln(' 3141 pts/0    00:00:00 ps');
        break;

      case 'find':
        const searchName = args[0] || '';
        const results = [];
        Object.keys(FILESYSTEM).forEach(dir => {
          FILESYSTEM[dir].forEach(file => {
            if (file.includes(searchName)) {
              results.push(dir === '/' ? `/${file}` : `${dir}/${file}`);
            }
          });
        });
        if (results.length > 0) {
          results.forEach(r => term.writeln(r));
        } else {
          term.writeln(`find: no results for '${searchName}'`);
        }
        break;

      case 'grep':
        if (args.length < 2) {
          term.writeln('\x1b[31mUsage: grep <pattern> <file>\x1b[0m');
        } else {
          const pattern = args[0];
          const grepFile = resolvePath(args[1]);
          const grepContent = FILECONTENTS[grepFile];
          if (!grepContent) {
            term.writeln(`\x1b[31mgrep: ${args[1]}: No such file or directory\x1b[0m`);
          } else {
            const lines = grepContent.split('\n').filter(l =>
              l.toLowerCase().includes(pattern.toLowerCase())
            );
            if (lines.length > 0) {
              lines.forEach(l => {
                const highlighted = l.replace(
                  new RegExp(pattern, 'gi'),
                  m => `\x1b[1;31m${m}\x1b[0m`
                );
                term.writeln(highlighted);
              });
            } else {
              term.writeln(`grep: no matches for '${pattern}'`);
            }
          }
        }
        break;

      case 'file':
        if (!args[0]) {
          term.writeln('\x1b[31mfile: missing operand\x1b[0m');
        } else {
          const fp = resolvePath(args[0]);
          if (FILESYSTEM[fp]) {
            term.writeln(`${args[0]}: directory`);
          } else if (FILECONTENTS[fp]) {
            const ext = args[0].split('.').pop();
            const types = {
              txt: 'ASCII text',
              py: 'Python script, ASCII text executable',
              sh: 'Bourne-Again shell script, ASCII text executable',
              log: 'ASCII text'
            };
            term.writeln(`${args[0]}: ${types[ext] || 'ASCII text'}`);
          } else {
            term.writeln(`\x1b[31mfile: ${args[0]}: No such file or directory\x1b[0m`);
          }
        }
        break;

      case 'base64':
        if (!args[0]) {
          term.writeln('\x1b[31mbase64: missing operand\x1b[0m');
        } else {
          const encoded = btoa(args.join(' '));
          term.writeln(encoded);
        }
        break;

      case 'history':
        commandHistoryRef.current.slice().reverse().forEach((cmd, i) => {
          term.writeln(`  ${i + 1}  ${cmd}`);
        });
        break;

      case 'clear':
        term.clear();
        break;

      case 'sudo':
        term.writeln('\x1b[31m[sudo] password for user:\x1b[0m');
        setTimeout(() => {
          term.writeln('\x1b[31mSorry, try again.\x1b[0m');
          term.writeln('\x1b[31msudo: 3 incorrect password attempts\x1b[0m');
          writePrompt(term);
        }, 1000);
        return;

      case 'ssh':
        term.writeln(`\x1b[33mSSH simulation - connecting to ${args[0] || 'target'}...\x1b[0m`);
        setTimeout(() => {
          term.writeln('\x1b[31mConnection refused (port 22)\x1b[0m');
          term.writeln('Try scanning for open ports first with nmap!');
          writePrompt(term);
        }, 800);
        return;

      case 'nmap':
        term.writeln(`\x1b[33mStarting Nmap scan...\x1b[0m`);
        setTimeout(() => {
          term.writeln('Host: 10.0.0.1 (target.lab)');
          term.writeln('PORT     STATE SERVICE');
          term.writeln('\x1b[32m22/tcp   open  ssh\x1b[0m');
          term.writeln('\x1b[32m80/tcp   open  http\x1b[0m');
          term.writeln('\x1b[32m3306/tcp open  mysql\x1b[0m');
          term.writeln('Nmap done: 1 IP address scanned');
          writePrompt(term);
        }, 1500);
        return;

      default:
        term.writeln(`\x1b[31m${cmd}: command not found\x1b[0m`);
        term.writeln(`Type \x1b[36mhelp\x1b[0m to see available commands`);
    }

    writePrompt(term);
  };

  return (
    <div className="terminal-page">
      <div className="terminal-header">
        <div>
          <h1>💻 Linux Terminal</h1>
          <p>Practice real Linux commands in a safe environment</p>
        </div>
        <div className="terminal-tips">
          <span className="tip">💡 Find the hidden flag!</span>
          <span className="tip">Tab = autocomplete</span>
          <span className="tip">↑↓ = history</span>
        </div>
      </div>

      <div className="terminal-container">
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <span className="terminal-title">user@cyberlab: {currentDir}</span>
        </div>
        <div ref={terminalRef} className="terminal-body" />
      </div>

      <div className="terminal-commands-ref">
        <h3>Quick Reference</h3>
        <div className="commands-grid">
          {[
            { cmd: 'ls', desc: 'List files' },
            { cmd: 'cd <dir>', desc: 'Change directory' },
            { cmd: 'cat <file>', desc: 'Read file' },
            { cmd: 'find <name>', desc: 'Find files' },
            { cmd: 'grep <pat> <file>', desc: 'Search in file' },
            { cmd: 'pwd', desc: 'Current directory' },
            { cmd: 'whoami', desc: 'Current user' },
            { cmd: 'nmap', desc: 'Scan network' },
            { cmd: 'uname', desc: 'System info' },
            { cmd: 'ps', desc: 'List processes' },
            { cmd: 'base64 <text>', desc: 'Encode text' },
            { cmd: 'clear', desc: 'Clear screen' },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="cmd-ref">
              <code>{cmd}</code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TerminalPage;