// src/gemini_client.js
const fetch = require('node-fetch');

async function callGemini(promptText) {
  const API_KEY = process.env.GEMINI_API_KEY;
  const endpointBase = process.env.GEMINI_ENDPOINT;

  if (!API_KEY) throw new Error('No GEMINI_API_KEY in env');
  if (!endpointBase) throw new Error('No GEMINI_ENDPOINT in env');

  // Build request body for Gemini 2.5 API
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: promptText }]
      }
    ]
  };

  // Append API key as query parameter
  const endpoint = endpointBase.includes('?')
    ? `${endpointBase}&key=${API_KEY}`
    : `${endpointBase}?key=${API_KEY}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    timeout: 30000
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Extract Gemini output from candidates[0].content.parts[0].text
  let rawText = null;
  try {
    if (
      json.candidates &&
      Array.isArray(json.candidates) &&
      json.candidates[0] &&
      json.candidates[0].content &&
      json.candidates[0].content.parts &&
      Array.isArray(json.candidates[0].content.parts) &&
      json.candidates[0].content.parts[0] &&
      typeof json.candidates[0].content.parts[0].text === 'string'
    ) {
      rawText = json.candidates[0].content.parts[0].text;
    }
  } catch (e) {
    rawText = null;
  }

  if (rawText) {
    // Remove triple backticks, 'json', and trim whitespace/newlines
    rawText = rawText.replace(/```json|```/gi, '').trim();
    rawText = rawText.replace(/^	*json	*/i, '').trim();
    try {
      return JSON.parse(rawText);
    } catch (err) {
      throw new Error(`Failed to parse JSON from Gemini output. Raw output:\n${rawText}`);
    }
  }

  throw new Error(`No valid JSON found in Gemini output. Raw output:\n${JSON.stringify(json)}`);
}

module.exports = { callGemini };
