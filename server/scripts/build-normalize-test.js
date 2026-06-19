const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { normalizeDockerfile } = require('../utils/dockerfileNormalize');

const slug = 'test-normalize-verify';
const dir = path.join(__dirname, '..', 'docker-labs', slug);
fs.mkdirSync(dir, { recursive: true });

const bad = `FROM php:7.4-apache
RUN echo "<?php
if(isset($_GET['q'])) echo $_GET['q'];
?>" > /var/www/html/index.php`;

fs.writeFileSync(path.join(dir, 'Dockerfile'), normalizeDockerfile(bad));
console.log('Building...');
execFileSync('docker', ['build', '-t', 'cyberlab-test-normalize', dir], { stdio: 'inherit' });
console.log('BUILD OK');
