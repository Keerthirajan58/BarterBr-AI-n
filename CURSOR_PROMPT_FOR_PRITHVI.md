# Cursor Prompt for Prithvi

Hey! I need to integrate an AI-powered price prediction API into our Flutter Barter Brain app. Here's what I need:

## Context
We have a Firebase Cloud Function that uses Google Gemini AI to predict product prices. The API is live and tested, working with 90% confidence. I need to add this to the product listing flow in the Flutter app.

**API Endpoint:**
```
POST https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation
```

## What I Need

1. **Create a service class** (`lib/services/price_prediction_service.dart`) that:
   - Makes POST requests to the API endpoint above
   - Takes product fields: title, description, category, condition, ageMonths, brand, accessories, images (all optional except title OR description)
   - Returns a PriceEstimate model with: value (double), confidence (double), breakdown (object), explanation (string)
   - Handles errors gracefully with try-catch
   - Has 60-second timeout (API can take 6-14 seconds)

2. **Add UI in the product listing screen** to:
   - Add a "Get AI Price Estimate" button
   - Show loading state while API is called (6-14 seconds)
   - Display the estimated price, confidence percentage, and explanation in a nice card or dialog
   - Handle errors with user-friendly messages

3. **Map my existing form fields** to the API fields:
   - My form has: [LIST YOUR ACTUAL FIELD NAMES HERE]
   - API expects: title, description, category, condition, ageMonths, brand, accessories, images
   - Help me map these correctly

## Request Format
```json
{
  "title": "iPhone 13 Pro",
  "description": "Gently used, 256GB",
  "category": "Electronics",
  "condition": "good",
  "ageMonths": 24,
  "brand": "Apple",
  "accessories": ["Box", "Charger"],
  "images": ["url1", "url2"]
}
```

## Response Format
```json
{
  "value": 535.54,
  "confidence": 0.9,
  "breakdown": {
    "basePrice": 1099,
    "ageFactor": 0.5,
    "conditionFactor": 0.92,
    "brandFactor": 1,
    "accessoryValue": 30
  },
  "explanation": "This valuation accounts for the iPhone 13 Pro's original price..."
}
```

## Requirements
- Use `http` package for API calls
- Create proper Dart models for request/response
- Show loading indicator (API takes 6-14 seconds)
- Format price as currency ($XXX.XX)
- Show confidence as percentage
- If confidence < 70%, show a warning that estimate is less reliable
- Add proper error handling

## Current App Structure
[DESCRIBE YOUR APP STRUCTURE: Where is the product form? What state management are you using? Provider? Bloc? GetX?]

Please help me:
1. Generate the complete service class with models
2. Show me how to integrate it into my existing product form screen
3. Create a nice UI component to display the price estimate

The full integration guide is in `MOBILE_INTEGRATION_GUIDE.md` if you need more details.
