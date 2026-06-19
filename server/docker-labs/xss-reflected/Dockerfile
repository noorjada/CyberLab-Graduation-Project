FROM php:7.4-apache

RUN apt-get update && apt-get install -y python3-minimal && rm -rf /var/lib/apt/lists/*

RUN python3 - << 'PYEOF'
php = r"""<?php
$q = isset($_GET["search"]) ? $_GET["search"] : "";
$xss = preg_match("/<script|onerror|onload|javascript:/i", $q);
?>
<html>
<head><title>CyberLab - Reflected XSS Lab</title></head>
<body style="background:#0d1117;color:#c9d1d9;padding:50px;font-family:monospace">
<h1 style="color:#58a6ff">CyberLab - Employee Search</h1>
<p style="color:#8b949e">Search the employee directory (input is reflected without sanitization):</p>
<form method="GET">
  <input name="search" value="<?php echo htmlspecialchars($q, ENT_QUOTES); ?>" placeholder="Search name..."
    style="padding:8px;width:300px;background:#161b22;color:white;border:1px solid #30363d">
  <input type="submit" value="Search"
    style="padding:8px 15px;background:#238636;color:white;border:none;cursor:pointer;margin-left:8px">
</form>
<?php if ($q !== ""): ?>
<p style="margin-top:20px">Results for: <?php echo $q; ?></p>
<?php if ($xss): ?>
<p style="color:#2ea043;background:#0d2318;padding:12px;border:1px solid #2ea043;margin-top:10px">
  [+] XSS payload detected! FLAG{XSS_4_L1FE}
</p>
<?php endif; ?>
<?php endif; ?>
</body></html>"""
open('/var/www/html/index.php', 'w').write(php)
PYEOF

EXPOSE 80