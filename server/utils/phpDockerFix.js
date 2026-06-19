/**
 * Fix common AI mistakes in PHP embedded inside Docker python blocks.
 */

function fixPhpContent(php) {
  let code = php;

  // Python-style vars: search_query = $_GET  →  $search_query = $_GET
  code = code.replace(
    /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\$_(?:GET|POST|REQUEST|SERVER|COOKIE|SESSION)\b)/gm,
    '$1$$$2 = $3'
  );

  // strpos(search_query,  →  strpos($search_query,
  code = code.replace(
    /\b(strpos|strlen|empty|isset|preg_match|htmlspecialchars|trim|intval)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,/g,
    (fn, v) => `${fn}($${v},`
  );

  // echo search_query  →  echo $search_query (simple cases)
  code = code.replace(
    /\b(echo|print|unset|isset)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/g,
    (stmt, v) => `${stmt} $${v};`
  );

  // Avoid double $$
  code = code.replace(/\$\$/g, '$');

  return code;
}

function fixPhpInDockerfile(dockerfile) {
  let c = dockerfile;

  c = c.replace(/php\s*=\s*r"""([\s\S]*?)"""/g, (full, body) => {
    return `php = r"""${fixPhpContent(body)}"""`;
  });

  c = c.replace(/content\s*=\s*r"""<\?php([\s\S]*?)"""/g, (full, body) => {
    return `content = r"""<?php${fixPhpContent(body)}"""`;
  });

  return c;
}

function validatePhpInDockerfile(dockerfile) {
  const blocks = [...dockerfile.matchAll(/r"""<\?php([\s\S]*?)"""/g)];
  const errors = [];

  for (const block of blocks) {
    const php = block[1];
    // Assignment without $ on left-hand side
    const badAssign = php.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*\$/m);
    if (badAssign) {
      errors.push(`Invalid PHP variable: ${badAssign[0].trim()}`);
    }
    if (/^\s*if\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(php)) {
      errors.push('PHP if-condition may use undeclared variable without $');
    }
  }

  return errors;
}

module.exports = { fixPhpContent, fixPhpInDockerfile, validatePhpInDockerfile };
