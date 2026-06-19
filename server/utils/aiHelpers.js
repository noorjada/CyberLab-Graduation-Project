const Groq = require('groq-sdk');

const MODEL = 'llama-3.1-8b-instant';

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('AI service not configured (GROQ_API_KEY missing)');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

/** Escape raw control chars inside JSON string literals (common LLM mistake). */
function repairJsonString(jsonStr) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    const code = ch.charCodeAt(0);

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && code < 32) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      else result += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }

    result += ch;
  }

  return result;
}

function tryParse(jsonStr) {
  return JSON.parse(jsonStr);
}

function extractJSON(text) {
  const attempts = [];

  const trimmed = text.trim();
  attempts.push(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) attempts.push(fenced[1].trim());

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    attempts.push(trimmed.slice(start, end + 1));
  }

  let lastError;
  for (const candidate of attempts) {
    for (const variant of [candidate, repairJsonString(candidate)]) {
      try {
        return tryParse(variant);
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(lastError?.message || 'AI returned invalid JSON');
}

async function chatCompletion(messages, { maxTokens = 500, temperature = 0.5, jsonMode = false } = {}) {
  const params = {
    model: MODEL,
    messages,
    max_tokens: maxTokens,
    temperature
  };

  if (jsonMode) {
    params.response_format = { type: 'json_object' };
  }

  const completion = await getGroq().chat.completions.create(params);
  return completion.choices[0].message.content;
}

async function chatJSON(systemPrompt, userPrompt, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const opts = {
    maxTokens: options.maxTokens || 1200,
    temperature: options.temperature ?? 0.4,
    jsonMode: true
  };

  try {
    const raw = await chatCompletion(messages, opts);
    return extractJSON(raw);
  } catch (firstErr) {
    // Retry once without json_mode in case the model/API rejects it
    try {
      const raw = await chatCompletion(messages, { ...opts, jsonMode: false, temperature: 0.2 });
      return extractJSON(raw);
    } catch (secondErr) {
      throw new Error(secondErr.message || firstErr.message || 'AI returned invalid JSON');
    }
  }
}

module.exports = { chatCompletion, chatJSON, extractJSON, repairJsonString, MODEL };
