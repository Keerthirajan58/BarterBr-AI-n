# Barter Brain - AI Product Price Prediction

An AI-powered product valuation system for a college barter marketplace, built with Firebase Cloud Functions and Google Gemini.

## 🎯 Features

- **AI-Powered Valuation**: Uses Google Gemini 2.5 Flash for intelligent price predictions
- **Multimodal Analysis**: Analyzes product text descriptions and up to 3 images
- **Detailed Breakdown**: Provides price breakdown including base price, age factor, condition factor, brand factor, and accessory value
- **High Confidence**: Achieves 70-90% confidence on tested products
- **Firebase Integration**: Deployed as serverless Cloud Functions

## 🚀 Live API

**Endpoint:**
```
POST https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 📱 Mobile Integration

Ready-to-use Flutter integration guide available in [MOBILE_INTEGRATION_GUIDE.md](./MOBILE_INTEGRATION_GUIDE.md).

Includes:
- Complete Flutter service class with models
- UI integration examples
- Field mapping guide
- Testing instructions
- Troubleshooting tips

## 🧪 Testing

Run the test script to verify the API:

```bash
node test_function.js
```

**Test Results:**
- ✅ iPhone 13 Pro: $535.54 (90% confidence)
- ✅ Calculus Textbook: $36 (70% confidence)
- ✅ PS5 Digital: $358.90 (90% confidence)

## 🛠️ Setup

### Prerequisites
- Node.js 22+
- Firebase CLI
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd barter-brain
```

2. Install dependencies:
```bash
npm install
cd functions && npm install
```

3. Set up environment variables:
```bash
# Create functions/.env
echo "GEMINI_API_KEY=your_api_key_here" > functions/.env
echo "GEMINI_MODEL=gemini-2.5-flash" >> functions/.env
```

4. Deploy to Firebase:
```bash
firebase deploy --only functions
```

## 📂 Project Structure

```
.
├── functions/
│   ├── index.js              # Main Cloud Function
│   ├── package.json          # Function dependencies
│   └── .env                  # Environment variables (not in repo)
├── src/
│   ├── gemini_client.js      # Gemini API client
│   ├── valuation_engine.js   # Price calculation logic
│   ├── reference_utils.js    # Reference data utilities
│   └── stub_server.js        # Local dev server
├── API_DOCUMENTATION.md      # Complete API docs
├── MOBILE_INTEGRATION_GUIDE.md # Flutter integration guide
├── test_function.js          # API test script
└── firebase.json             # Firebase configuration
```

## 🔑 Environment Variables

Required in `functions/.env`:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `GEMINI_MODEL`: Model to use (default: `gemini-2.5-flash`)

**⚠️ Never commit `.env` files to the repository!**

## 📊 API Request Example

```json
{
  "title": "iPhone 13 Pro",
  "description": "Gently used, 256GB, minor scratches",
  "category": "Electronics",
  "condition": "good",
  "ageMonths": 24,
  "brand": "Apple",
  "accessories": ["Original Box", "Charger"],
  "images": ["https://example.com/image1.jpg"]
}
```

## 📈 API Response Example

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
  "explanation": "This valuation accounts for the iPhone 13 Pro's original price, two-year age, and good condition with minor scratches."
}
```

## 🤝 Contributing

This is a college project. For questions or contributions, please reach out to the team.

## 📄 License

MIT

## 🔗 Resources

- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Google Gemini API](https://ai.google.dev/docs)
- [Flutter Integration Guide](./MOBILE_INTEGRATION_GUIDE.md)

---

**Built with ❤️ for Barter Brain - College Marketplace**
