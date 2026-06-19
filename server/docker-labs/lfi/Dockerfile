FROM php:7.4-apache

RUN apt-get update && apt-get install -y python3-minimal && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/www/pages /var/www/html/admin

RUN python3 - << 'PYEOF'
index = r"""<?php
$page = isset($_GET["page"]) ? $_GET["page"] : "home";
?>
<html>
<head><title>CyberLab - Document Portal</title></head>
<body style="background:#0d1117;color:#c9d1d9;padding:50px;font-family:monospace">
<h1 style="color:#58a6ff">CyberLab - Internal Document Portal</h1>
<nav style="margin:20px 0;padding:10px;background:#161b22;border:1px solid #30363d">
  <a href="?page=home" style="color:#58a6ff;margin-right:20px">Home</a>
  <a href="?page=about" style="color:#58a6ff;margin-right:20px">About</a>
  <a href="?page=docs" style="color:#58a6ff">Documentation</a>
</nav>
<div id="content" style="margin-top:20px;padding:20px;background:#161b22;border:1px solid #21262d;min-height:200px">
<?php
$allowed = ['home', 'about', 'docs'];
include('/var/www/pages/' . $page);
?>
</div>
<hr style="border-color:#21262d;margin-top:40px">
<p style="color:#484f58;font-size:0.85em">URL param: <code style="color:#e3b341">?page=home</code> | <code style="color:#e3b341">?page=about</code> | <code style="color:#e3b341">?page=docs</code></p>
</body></html>"""

home = "<h2 style='color:#58a6ff'>Welcome</h2><p>Internal document portal for CyberCorp employees.</p><p style='color:#8b949e'>Navigate using the menu above.</p>"
about = "<h2 style='color:#58a6ff'>About</h2><p>This portal serves internal documentation.</p><p style='color:#8b949e'>Restricted to authorized personnel only.</p>"
docs = "<h2 style='color:#58a6ff'>Documentation</h2><ul><li>Employee Handbook</li><li>Security Policy</li><li>IT Guidelines</li></ul>"
flag = "FLAG{lfi_p4th_tr4v3rs4l_0wn3d}"

open('/var/www/html/index.php', 'w').write(index)
open('/var/www/pages/home', 'w').write(home)
open('/var/www/pages/about', 'w').write(about)
open('/var/www/pages/docs', 'w').write(docs)
open('/var/www/html/admin/flag.txt', 'w').write(flag)
PYEOF

EXPOSE 80
