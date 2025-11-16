// src/stub_server.js
require('dotenv').config(); // load .env
const express = require('express');
const cors = require('cors');
const sample = require('../sample_data.json');
const { generateValuation } = require('./valuation_engine');
const { callGemini } = require('./gemini_client');
const { computeFairness } = require('./reference_utils');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4000;

console.log('Stub server listening on http://localhost:' + PORT);

app.get('/', (req, res) => res.send('barter-brain stub server running'));

// GET: return seeded demo valuation by id (for frontend to use in demo)
app.get('/ai/getValuation', (req, res) => {
  const itemId = req.query.itemId;
  if (!itemId) return res.status(400).json({ error: 'missing itemId' });
  const item = sample[itemId];
  if (!item) return res.status(404).json({ error: 'not found' });
  return res.json({
    value: item.value,
    confidence: item.confidence,
    breakdown: item.breakdown,
    explanation: item.explanation
  });
});

// POST: take metadata and try Gemini, otherwise fallback to local engine
app.post('/ai/metadataValuation', async (req, res) => {
  const metadata = req.body || {};
  if (!metadata.title && !metadata.description) {
    return res.status(400).json({ error: 'provide title or description' });
  }

  console.log("GEMINI_API_KEY loaded?", !!process.env.GEMINI_API_KEY);
  console.log("Using Gemini endpoint:", process.env.GEMINI_ENDPOINT);

  // If no key/endpoint, use fallback
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_ENDPOINT) {
    return res.json(generateValuation(metadata));
  }

  // Build the valuation prompt (same schema as prompt_library.md)
  const prompt = `
You are an expert used-goods valuation assistant for a college barter marketplace.
Input metadata as JSON: ${JSON.stringify(metadata)}.
Return valid JSON only, following this exact schema:

{
  "value": <float>,
  "confidence": <float>,
  "breakdown": {
    "basePrice": <float>,
    "ageFactor": <float>,
    "conditionFactor": <float>,
    "brandFactor": <float>,
    "accessoryValue": <float>
  },
  "explanation": "<short human explanation 1-3 sentences>"
}

Compute value = round(basePrice * ageFactor * conditionFactor * brandFactor + accessoryValue, 2).
If you cannot determine basePrice, return basePrice=null and confidence=0.0.
`;

  try {
    const parsed = await callGemini(prompt);
    // Validate shape
    if (!parsed || parsed.value == null || !parsed.breakdown) {
      const fallback = generateValuation(metadata);
      fallback.explanation = fallback.explanation + ' (fallback: Gemini returned invalid output)';
      return res.json(fallback);
    }

    const value = Number(parsed.value || 0);
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence || 0)));
    const breakdown = parsed.breakdown || {};
    const b = {
      basePrice: Number(breakdown.basePrice || 0),
      ageFactor: Number(breakdown.ageFactor || 1),
      conditionFactor: Number(breakdown.conditionFactor || 1),
      brandFactor: Number(breakdown.brandFactor || 1),
      accessoryValue: Number(breakdown.accessoryValue || 0)
    };

    return res.json({
      value: Math.round((value + Number.EPSILON) * 100) / 100,
      confidence: Math.round((confidence + Number.EPSILON) * 100) / 100,
      breakdown: b,
      explanation: String(parsed.explanation || '')
    });
  } catch (err) {
    console.error('Gemini call failed:', (err && err.message) || err);
    const fallback = generateValuation(metadata);
    fallback.explanation = fallback.explanation + ' (fallback: Gemini error)';
    return res.json(fallback);
  }
});

// fairness endpoint (basic)
app.post('/ai/computeFairness', (req, res) => {
  const { offer, request, proposerCash } = req.body || {};
  if (!offer || !request) return res.status(400).json({ error: 'offer and request required' });
  const fairness = computeFairness(Number(offer.value || 0), Number(request.value || 0), Number(proposerCash || 0));
  const explanation = `Computed as (offer ${offer.value} + proposerCash ${proposerCash || 0}) / request ${request.value}. Suggested cash to equalize: ${fairness.suggestedCash}.`;
  return res.json({
    fairnessScore: fairness.fairnessScore,
    suggestedCash: fairness.suggestedCash,
    explanation,
    offerVal: Number(offer.value || 0),
    requestVal: Number(request.value || 0)
  });
});

app.listen(PORT);