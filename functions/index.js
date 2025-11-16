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

// AI Chat-Negotiation Coach endpoint
app.post('/ai/negotiationCoach', async (req, res) => {
  const { chatTranscript, userItem, otherUserItem, currentOffer } = req.body || {};
  
  // Validation
  if (!chatTranscript || !Array.isArray(chatTranscript) || chatTranscript.length === 0) {
    return res.status(400).json({ error: 'chatTranscript is required and must be a non-empty array' });
  }
  if (!userItem || !userItem.title) {
    return res.status(400).json({ error: 'userItem with title is required' });
  }
  if (!otherUserItem || !otherUserItem.title) {
    return res.status(400).json({ error: 'otherUserItem with title is required' });
  }

  // Build prompt for negotiation coaching
  let promptText = `You are an expert negotiation coach for a college barter marketplace. Analyze the conversation and provide helpful negotiation advice.\n\n`;
  
  promptText += `USER'S ITEM:\n`;
  promptText += `- Title: ${userItem.title}\n`;
  if (userItem.description) promptText += `- Description: ${userItem.description}\n`;
  if (userItem.estimatedValue) promptText += `- Estimated Value: $${userItem.estimatedValue}\n`;
  if (userItem.condition) promptText += `- Condition: ${userItem.condition}\n`;
  
  promptText += `\nOTHER USER'S ITEM:\n`;
  promptText += `- Title: ${otherUserItem.title}\n`;
  if (otherUserItem.description) promptText += `- Description: ${otherUserItem.description}\n`;
  if (otherUserItem.estimatedValue) promptText += `- Estimated Value: $${otherUserItem.estimatedValue}\n`;
  if (otherUserItem.condition) promptText += `- Condition: ${otherUserItem.condition}\n`;
  
  if (currentOffer) {
    promptText += `\nCURRENT OFFER:\n`;
    if (currentOffer.cashAdjustment !== undefined) {
      promptText += `- Cash adjustment: $${currentOffer.cashAdjustment} ${currentOffer.cashAdjustment > 0 ? '(user pays)' : '(user receives)'}\n`;
    }
    if (currentOffer.status) promptText += `- Status: ${currentOffer.status}\n`;
  }
  
  promptText += `\nCHAT TRANSCRIPT (most recent 20 messages):\n`;
  const recentMessages = chatTranscript.slice(-20);
  recentMessages.forEach((msg, idx) => {
    const sender = msg.isCurrentUser ? 'YOU' : 'THEM';
    promptText += `[${sender}]: ${msg.message}\n`;
  });
  
  promptText += `\n\nBased on the conversation and items, provide negotiation advice. Return ONLY valid JSON with this exact schema:\n\n`;
  promptText += `{\n`;
  promptText += `  "suggestionPhrase": "<A friendly, natural message the user can send (1-2 sentences)>",\n`;
  promptText += `  "suggestedCashAdjustment": <number (positive if user should pay, negative if user should receive, 0 for even swap)>,\n`;
  promptText += `  "explanation": "<Brief explanation of the strategy and why this approach makes sense (2-3 sentences)>",\n`;
  promptText += `  "negotiationTips": ["<tip1>", "<tip2>", "<tip3>"]\n`;
  promptText += `}\n\n`;
  promptText += `Make suggestions friendly, college-student appropriate, and focused on fair value exchange. Consider item conditions, estimated values, and conversation tone. And if the determined price itself seemed fair, just say that its already a fair trade, so no adjustment is needed.`;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const result = await model.generateContent([{ text: promptText }]);
    const response = await result.response;
    let rawText = response.text();
    
    // Clean up response
    rawText = rawText.replace(/```json|```/gi, '').trim();
    rawText = rawText.replace(/^\s*json\s*/i, '').trim();
    const parsedResult = JSON.parse(rawText);
    
    return res.json(parsedResult);
  } catch (err) {
    console.error('Negotiation coach failed:', err);
    return res.status(500).json({ error: 'Negotiation coach error', details: err.message });
  }
});

// Helper to fetch image and convert to base64
async function fetchImageAsBase64(url) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url);
  const buffer = await response.buffer();
  return buffer.toString('base64');
}

exports.BarterBrainAPI = functions.https.onRequest(app);
