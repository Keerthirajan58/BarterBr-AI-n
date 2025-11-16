// Firebase Cloud Function for AI valuation with Gemini multimodal support
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Main AI valuation endpoint
app.post('/ai/metadataValuation', async (req, res) => {
  const metadata = req.body || {};
  if (!metadata.title && !metadata.description) {
    return res.status(400).json({ error: 'provide title or description' });
  }

  // Accept up to 3 image URLs
  const images = Array.isArray(metadata.images) ? metadata.images.slice(0, 3) : [];
  const productLink = metadata.productLink || '';

  // Build prompt text
  let promptText = `You are an expert used-goods valuation assistant for a college barter marketplace.\n`;
  if (images.length > 0) {
    promptText += `Images provided.\n`;
  }
  if (productLink) {
    promptText += `Product link: ${productLink}.\n`;
  }
  promptText += `Input metadata as JSON: ${JSON.stringify(metadata)}.\n`;
  promptText += `Return valid JSON only, following this exact schema:\n\n`;
  promptText += `{"value": <float>, "confidence": <float>, "breakdown": {"basePrice": <float>, "ageFactor": <float>, "conditionFactor": <float>, "brandFactor": <float>, "accessoryValue": <float>}, "explanation": "<short human explanation 1-3 sentences>"}\n`;
  promptText += `Compute value = round(basePrice * ageFactor * conditionFactor * brandFactor + accessoryValue, 2). If you cannot determine basePrice, return basePrice=null and confidence=0.0.`;

  // Prepare Gemini SDK
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // Prepare content parts
  const parts = [{ text: promptText }];
  
  // Add images if provided
  if (images.length > 0) {
    for (const imageUrl of images) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: await fetchImageAsBase64(imageUrl)
        }
      });
    }
  }

  try {
    const result = await model.generateContent(parts);
    const response = await result.response;
    let rawText = response.text();
    
    // Clean up response
    rawText = rawText.replace(/```json|```/gi, '').trim();
    rawText = rawText.replace(/^\s*json\s*/i, '').trim();
    const parsedResult = JSON.parse(rawText);
    return res.json(parsedResult);
  } catch (err) {
    console.error('Gemini call failed:', err);
    return res.status(500).json({ error: 'Gemini error', details: err.message });
  }
});

// Helper to fetch image and convert to base64
async function fetchImageAsBase64(url) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url);
  const buffer = await response.buffer();
  return buffer.toString('base64');
}

exports.ProductPricePredictionApi = functions.https.onRequest(app);
