FROM php:7.4-apache

RUN apt-get update && apt-get install -y python3-minimal iputils-ping && rm -rf /var/lib/apt/lists/*

RUN python3 - << 'PYEOF'
php = r"""<?php
$output = "";
if (isset($_POST["host"])) {
    $host = $_POST["host"];
    $output = shell_exec("ping -c 2 " . $host . " 2>&1");
}
?>
<html>
<head><title>CyberLab - Network Ping Tool</title></head>
<body style="background:#0d1117;color:#c9d1d9;padding:50px;font-family:monospace">
<h1 style="color:#58a6ff">CyberLab - Network Ping Utility</h1>
<p style="color:#8b949e">Enter a hostname or IP address to ping:</p>
<form method="POST">
  <input name="host" placeholder="e.g. 127.0.0.1"
    style="padding:8px;width:300px;background:#161b22;color:white;border:1px solid #30363d">
  <input type="submit" value="Ping"
    style="padding:8px 15px;background:#1f6feb;color:white;border:none;cursor:pointer;margin-left:8px">
</form>
<?php if($output): ?>
<pre style="background:#161b22;padding:15px;margin-top:20px;border:1px solid #30363d;overflow-x:auto;white-space:pre-wrap"><?php echo $output; ?></pre>
<?php endif; ?>
<hr style="border-color:#21262d;margin-top:50px">
<p style="color:#484f58;font-size:0.85em">Backend runs: <code style="color:#e3b341">ping -c 2 [user_input]</code></p>
</body></html>"""
open('/var/www/html/index.php', 'w').write(php)
PYEOF

RUN echo "FLAG{cmd_1nj3ct10n_rce}" > /root/flag.txt

EXPOSE 80
