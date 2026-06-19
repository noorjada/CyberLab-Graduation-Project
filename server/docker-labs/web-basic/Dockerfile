FROM php:7.4-apache

RUN apt-get update && apt-get install -y libsqlite3-dev && \
    docker-php-ext-install pdo pdo_sqlite && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/www/db && chmod 777 /var/www/db

RUN echo '<?php \
$db = new SQLite3("/var/www/db/users.db"); \
$db->exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)"); \
$db->exec("INSERT OR IGNORE INTO users VALUES (1, '"'"'admin'"'"', '"'"'supersecret123'"'"')"); \
if ($_SERVER["REQUEST_METHOD"] === "POST") { \
    $user = $_POST["username"]; \
    $pass = $_POST["password"]; \
    $query = "SELECT * FROM users WHERE username='"'"'".$user."'"'"' AND password='"'"'".$pass."'"'"'"; \
    $result = $db->query($query); \
    $row = $result->fetchArray(); \
    if ($row) { echo "<h2 style=color:green>Welcome ".$row["username"]."! Flag: FLAG{sqli_web_pwned}</h2>"; } \
    else { echo "<h2 style=color:red>Login Failed!</h2>"; } \
} \
?> \
<html><body style="background:#1a1a2e;color:white;padding:50px;font-family:sans-serif"> \
<h1>CyberLab Vulnerable Login</h1> \
<form method="POST"> \
Username: <input name="username" style="padding:5px;margin:10px"><br> \
Password: <input name="password" type="password" style="padding:5px;margin:10px"><br> \
<input type="submit" value="Login" style="padding:8px 20px;background:#1f6feb;color:white;border:none"> \
</form> \
<p style="color:#8b949e">Hint: Try SQL injection on the username field</p> \
</body></html>' > /var/www/html/index.php

RUN echo "FLAG{sqli_web_pwned}" > /root/flag.txt

EXPOSE 80