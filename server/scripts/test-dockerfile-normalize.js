const { normalizeDockerfile } = require('../utils/dockerfileNormalize');
const fs = require('fs');
const path = require('path');

const xssPath = path.join(__dirname, '..', 'docker-labs', 'xss-reflected', 'Dockerfile');
const bad = fs.existsSync(xssPath)
  ? fs.readFileSync(xssPath, 'utf8')
  : `FROM php:7.4-apache
RUN apt-get update && apt-get install -y python3-minimal && rm -rf /var/lib/apt/lists/*
RUN python3 - << 'PYEOF'
php = r"""<?php echo 1; ?>"""
open('/var/www/html/index.php', 'w').write(php)
PYEOF
RUN echo "<input type='text'>
<script>alert(1);</script>" > /var/www/html/search.html
EXPOSE 80`;

const fixed = normalizeDockerfile(bad);
console.log(fixed);
console.log('\n--- checks ---');
console.log('no bare <script> line:', !/^[^#]*<script>/m.test(fixed.split('\n').filter(l => !l.trim().startsWith('RUN') && !l.includes('r"""')).join('\n')));
console.log('no RUN echo html:', !/RUN\s+echo\s+"</.test(fixed));
console.log('has PYEOF blocks:', (fixed.match(/PYEOF/g) || []).length >= 2);
