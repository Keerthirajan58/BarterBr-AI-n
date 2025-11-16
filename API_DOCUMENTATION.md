# Barter Brain API Documentation

## Product Price Prediction API

### Endpoint
```
POST https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation
```

### Description
AI-powered valuation endpoint that uses Google Gemini to predict the market value of used products based on metadata and optional images.

---

## Request

### Headers
```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes* | Product title/name |
| `description` | string | Yes* | Detailed product description |
| `category` | string | No | Product category (e.g., "Electronics", "Books") |
| `condition` | string | No | Condition: "new", "excellent", "good", "fair", "poor" |
| `ageMonths` | number | No | Age of product in months |
| `brand` | string | No | Brand/manufacturer name |
| `accessories` | array | No | List of included accessories |
| `images` | array | No | Array of image URLs (max 3) |
| `productLink` | array | No | Reference product link |

*At least one of `title` or `description` is required.

### Example Request

```json
{
  "title": "iPhone 13 Pro",
  "description": "Gently used iPhone 13 Pro, 256GB, Pacific Blue. Minor scratches on back.",
  "category": "Electronics",
  "condition": "good",
  "ageMonths": 24,
  "brand": "Apple",
  "accessories": ["Original Box", "Charger", "Case"],
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "productLink": "https://www.apple.com/iphone-13-pro/"
}
```

---

## Response

### Success Response (200 OK)

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
  "explanation": "This valuation accounts for the iPhone 13 Pro's original price, two-year age, and good condition with minor scratches. The included original accessories add a small premium."
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `value` | number | Estimated market value in USD |
| `confidence` | number | Confidence score (0.0 - 1.0) |
| `breakdown.basePrice` | number | Original/base product price |
| `breakdown.ageFactor` | number | Age depreciation multiplier |
| `breakdown.conditionFactor` | number | Condition quality multiplier |
| `breakdown.brandFactor` | number | Brand value multiplier |
| `breakdown.accessoryValue` | number | Additional value from accessories |
| `explanation` | string | Human-readable valuation explanation |

### Error Responses

#### 400 Bad Request
```json
{
  "error": "provide title or description"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Gemini error",
  "details": "Error message details"
}
```

---

## Mobile Integration Examples

### React Native (JavaScript)

```javascript
async function getPriceEstimate(productData) {
  const API_URL = 'https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation';
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Price estimation failed:', error);
    throw error;
  }
}

// Usage
const productData = {
  title: 'iPhone 13 Pro',
  description: 'Gently used, 256GB',
  condition: 'good',
  ageMonths: 24,
  brand: 'Apple'
};

getPriceEstimate(productData)
  .then(result => {
    console.log('Estimated value:', result.value);
    console.log('Confidence:', result.confidence);
    console.log('Explanation:', result.explanation);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class PricePredictionService {
  static const String apiUrl = 
    'https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation';
  
  Future<Map<String, dynamic>> getPriceEstimate(Map<String, dynamic> productData) async {
    try {
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(productData),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get price estimate: ${response.statusCode}');
      }
    } catch (e) {
      print('Error: $e');
      rethrow;
    }
  }
}

// Usage
final service = PricePredictionService();
final productData = {
  'title': 'iPhone 13 Pro',
  'description': 'Gently used, 256GB',
  'condition': 'good',
  'ageMonths': 24,
  'brand': 'Apple',
};

final result = await service.getPriceEstimate(productData);
print('Estimated value: \$${result['value']}');
print('Confidence: ${(result['confidence'] * 100).toStringAsFixed(1)}%');
```

### Swift (iOS)

```swift
import Foundation

struct ProductData: Codable {
    let title: String
    let description: String
    let category: String?
    let condition: String?
    let ageMonths: Int?
    let brand: String?
    let accessories: [String]?
    let images: [String]?
}

struct PriceEstimate: Codable {
    let value: Double
    let confidence: Double
    let breakdown: Breakdown
    let explanation: String
    
    struct Breakdown: Codable {
        let basePrice: Double
        let ageFactor: Double
        let conditionFactor: Double
        let brandFactor: Double
        let accessoryValue: Double
    }
}

class PricePredictionService {
    static let apiURL = "https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation"
    
    func getPriceEstimate(productData: ProductData) async throws -> PriceEstimate {
        guard let url = URL(string: Self.apiURL) else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(productData)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(PriceEstimate.self, from: data)
    }
}

// Usage
let service = PricePredictionService()
let productData = ProductData(
    title: "iPhone 13 Pro",
    description: "Gently used, 256GB",
    category: "Electronics",
    condition: "good",
    ageMonths: 24,
    brand: "Apple",
    accessories: nil,
    images: nil
)

Task {
    do {
        let estimate = try await service.getPriceEstimate(productData: productData)
        print("Estimated value: $\(estimate.value)")
        print("Confidence: \(estimate.confidence * 100)%")
        print("Explanation: \(estimate.explanation)")
    } catch {
        print("Error: \(error)")
    }
}
```

---

## Performance

- **Average Response Time**: 6-14 seconds (includes AI processing and image analysis)
- **Rate Limits**: Subject to Firebase Cloud Functions limits
- **Timeout**: 60 seconds

## Notes

1. **Images**: When providing image URLs, ensure they are publicly accessible. The function will fetch and analyze up to 3 images.
2. **Response Times**: Requests with images take longer due to image processing.
3. **Confidence**: Higher confidence scores indicate more reliable estimates. Scores below 0.5 suggest the AI has limited information.
4. **Error Handling**: Always implement proper error handling in your mobile app for network failures and API errors.

---

## Testing

A test script is available at `test_function.js` in the project root. Run it with:

```bash
node test_function.js
```

## Support

For issues or questions, check the Firebase console logs at:
https://console.firebase.google.com/project/barterbrain-1254a/functions/logs
