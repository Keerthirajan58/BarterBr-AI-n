# Mobile Integration - Product Price Prediction API

## For: Prithvi (Mobile Developer)
## Date: November 15, 2025

---

## 🎯 What's Ready

A **Firebase Cloud Function** is deployed and tested that provides AI-powered product price predictions using Google Gemini. It's working perfectly with 90% confidence on test data.

**Live Endpoint:**
```
https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation
```

---

## 📋 Your Task

Integrate this API into the Flutter mobile app so users can get instant AI price estimates for their products.

---

## 🔌 API Details

### Endpoint
- **Method:** POST
- **URL:** `https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation`
- **Content-Type:** `application/json`

### Request Body (Flexible - send what you have)

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

**Required:** At least `title` OR `description` (one of them must be present)
**Optional:** All other fields - send whatever you have from your forms

### Response

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

---

## 📱 Flutter Integration Code

### 1. Add HTTP Package (if not already added)

```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
```

### 2. Create Service Class

```dart
// lib/services/price_prediction_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class PricePredictionService {
  static const String _apiUrl = 
    'https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation';
  
  /// Get AI price prediction for a product
  /// Returns estimated value, confidence, and explanation
  Future<PriceEstimate?> getPriceEstimate({
    String? title,
    String? description,
    String? category,
    String? condition,
    int? ageMonths,
    String? brand,
    List<String>? accessories,
    List<String>? images,
    String? productLink,
  }) async {
    // Validate: need at least title or description
    if ((title == null || title.isEmpty) && 
        (description == null || description.isEmpty)) {
      throw ArgumentError('Must provide either title or description');
    }

    // Build request body - only include non-null values
    final Map<String, dynamic> requestBody = {};
    if (title != null && title.isNotEmpty) requestBody['title'] = title;
    if (description != null && description.isNotEmpty) requestBody['description'] = description;
    if (category != null && category.isNotEmpty) requestBody['category'] = category;
    if (condition != null && condition.isNotEmpty) requestBody['condition'] = condition;
    if (ageMonths != null) requestBody['ageMonths'] = ageMonths;
    if (brand != null && brand.isNotEmpty) requestBody['brand'] = brand;
    if (accessories != null && accessories.isNotEmpty) requestBody['accessories'] = accessories;
    if (images != null && images.isNotEmpty) requestBody['images'] = images.take(3).toList(); // Max 3 images
    if (productLink != null && productLink.isNotEmpty) requestBody['productLink'] = productLink;

    try {
      print('🔄 Calling price prediction API...');
      print('Request: ${jsonEncode(requestBody)}');
      
      final response = await http.post(
        Uri.parse(_apiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(requestBody),
      ).timeout(
        const Duration(seconds: 60), // API can take 6-14 seconds
        onTimeout: () => throw Exception('Request timeout - please try again'),
      );
      
      print('✅ Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('Response data: $data');
        return PriceEstimate.fromJson(data);
      } else {
        final error = jsonDecode(response.body);
        throw Exception('API Error: ${error['error'] ?? 'Unknown error'}');
      }
    } catch (e) {
      print('❌ Price prediction error: $e');
      rethrow;
    }
  }
}

/// Model for price estimate response
class PriceEstimate {
  final double value;
  final double confidence;
  final PriceBreakdown breakdown;
  final String explanation;

  PriceEstimate({
    required this.value,
    required this.confidence,
    required this.breakdown,
    required this.explanation,
  });

  factory PriceEstimate.fromJson(Map<String, dynamic> json) {
    return PriceEstimate(
      value: (json['value'] as num).toDouble(),
      confidence: (json['confidence'] as num).toDouble(),
      breakdown: PriceBreakdown.fromJson(json['breakdown']),
      explanation: json['explanation'] as String,
    );
  }

  /// Format value as currency
  String get formattedValue => '\$${value.toStringAsFixed(2)}';
  
  /// Get confidence as percentage
  String get confidencePercentage => '${(confidence * 100).toStringAsFixed(0)}%';
  
  /// Check if estimate is reliable (confidence > 0.7)
  bool get isReliable => confidence > 0.7;
}

class PriceBreakdown {
  final double? basePrice;
  final double ageFactor;
  final double conditionFactor;
  final double brandFactor;
  final double accessoryValue;

  PriceBreakdown({
    this.basePrice,
    required this.ageFactor,
    required this.conditionFactor,
    required this.brandFactor,
    required this.accessoryValue,
  });

  factory PriceBreakdown.fromJson(Map<String, dynamic> json) {
    return PriceBreakdown(
      basePrice: json['basePrice'] != null ? (json['basePrice'] as num).toDouble() : null,
      ageFactor: (json['ageFactor'] as num).toDouble(),
      conditionFactor: (json['conditionFactor'] as num).toDouble(),
      brandFactor: (json['brandFactor'] as num).toDouble(),
      accessoryValue: (json['accessoryValue'] as num).toDouble(),
    );
  }
}
```

### 3. Usage Example in Your Product Form/Screen

```dart
// Example: In your product creation/listing screen
import 'package:flutter/material.dart';
import 'services/price_prediction_service.dart';

class ProductFormScreen extends StatefulWidget {
  @override
  _ProductFormScreenState createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  final _service = PricePredictionService();
  
  // Your existing form controllers
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String? _selectedCategory;
  String? _selectedCondition;
  String? _brand;
  List<String> _imageUrls = [];
  
  bool _isLoadingPrice = false;
  PriceEstimate? _priceEstimate;

  Future<void> _getPriceEstimate() async {
    setState(() {
      _isLoadingPrice = true;
      _priceEstimate = null;
    });

    try {
      final estimate = await _service.getPriceEstimate(
        title: _titleController.text,
        description: _descriptionController.text,
        category: _selectedCategory,
        condition: _selectedCondition,
        brand: _brand,
        images: _imageUrls, // Your uploaded image URLs
        // Add other fields as needed from your form
      );

      setState(() {
        _priceEstimate = estimate;
      });

      // Optionally show a dialog or update UI
      if (estimate != null && estimate.isReliable) {
        _showPriceEstimateDialog(estimate);
      }
    } catch (e) {
      // Show error to user
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to get price estimate: $e')),
      );
    } finally {
      setState(() {
        _isLoadingPrice = false;
      });
    }
  }

  void _showPriceEstimateDialog(PriceEstimate estimate) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('AI Price Estimate'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              estimate.formattedValue,
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.green),
            ),
            SizedBox(height: 8),
            Text('Confidence: ${estimate.confidencePercentage}'),
            SizedBox(height: 16),
            Text(estimate.explanation, style: TextStyle(fontSize: 14)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('List Product')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Your existing form fields
            TextField(
              controller: _titleController,
              decoration: InputDecoration(labelText: 'Product Title'),
            ),
            TextField(
              controller: _descriptionController,
              decoration: InputDecoration(labelText: 'Description'),
              maxLines: 3,
            ),
            
            SizedBox(height: 20),
            
            // Add "Get Price Estimate" button
            ElevatedButton.icon(
              onPressed: _isLoadingPrice ? null : _getPriceEstimate,
              icon: _isLoadingPrice 
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(Icons.auto_awesome),
              label: Text(_isLoadingPrice ? 'Getting Estimate...' : 'Get AI Price Estimate'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
            
            // Show estimate if available
            if (_priceEstimate != null) ...[
              SizedBox(height: 20),
              Card(
                color: Colors.green.shade50,
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text('Estimated Value', style: TextStyle(fontSize: 12)),
                      Text(
                        _priceEstimate!.formattedValue,
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      Text('${_priceEstimate!.confidencePercentage} confidence'),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

---

## 🗺️ Field Mapping Guide

**Map your existing Flutter fields to API fields:**

| Your Field Name | API Field | Type | Notes |
|----------------|-----------|------|-------|
| Product name/title | `title` | String | Required if no description |
| Product description | `description` | String | Required if no title |
| Category dropdown | `category` | String | e.g., "Electronics", "Books", "Furniture" |
| Condition dropdown | `condition` | String | "new", "excellent", "good", "fair", "poor" |
| Purchase date → calculate age | `ageMonths` | int | Convert date to months |
| Brand field | `brand` | String | Manufacturer/brand name |
| Accessories checklist | `accessories` | List<String> | Array of accessory names |
| Uploaded images | `images` | List<String> | Max 3 URLs, must be publicly accessible |
| Reference URL | `productLink` | String | Optional product reference |

**If you have different field names, just map them in the service call.**

---

## ⚠️ Important Notes

1. **Response Time:** API takes 6-14 seconds. Show a loading indicator!
2. **Images:** If you send image URLs, they must be publicly accessible (use Firebase Storage public URLs)
3. **Timeout:** Set 60-second timeout for the HTTP request
4. **Error Handling:** Always wrap in try-catch and show user-friendly error messages
5. **Confidence:** Values below 70% confidence should be shown with a warning

---

## 🧪 Testing Steps

1. **Quick Test (No Images):**
   ```dart
   final estimate = await service.getPriceEstimate(
     title: 'iPhone 13 Pro',
     description: 'Used, good condition',
     condition: 'good',
   );
   print('Value: ${estimate.formattedValue}');
   ```

2. **Full Test (With All Fields):**
   - Fill your product form completely
   - Include images (use public URLs from Firebase Storage)
   - Click "Get Price Estimate" button
   - Verify response shows in 6-15 seconds

3. **Edge Cases to Test:**
   - Only title, no description
   - Only description, no title
   - With 3 images
   - Different categories (Electronics, Books, Furniture, etc.)
   - Different conditions (new, excellent, good, fair, poor)

---

## 🐛 Troubleshooting

**"Request timeout"**
- API is slow with images (up to 14 seconds is normal)
- Increase timeout to 60 seconds

**"provide title or description"**
- You're sending empty/null values for both fields
- Ensure at least one has content

**"Gemini error"**
- Backend issue, check Firebase console logs
- Might be temporary, retry after a few seconds

**Images not being analyzed**
- Ensure image URLs are publicly accessible (not behind auth)
- Use Firebase Storage with public read rules
- Verify URLs return actual images (test in browser)

---

## 📊 Expected Results (Based on Tests)

- **iPhone 13 Pro (2 years old, good condition):** ~$535, 90% confidence
- **Calculus Textbook (1 year old, good):** ~$36, 70% confidence  
- **PS5 Digital (6 months old, excellent):** ~$359, 90% confidence

Your results should be similar for comparable products.

---

## 🔗 Resources

- **Full API Documentation:** Check `API_DOCUMENTATION.md` in the project root
- **Test Script:** `test_function.js` shows working examples
- **Firebase Console:** https://console.firebase.google.com/project/barterbrain-1254a/functions

---

## 💬 Questions?

If you run into issues:
1. Check the Firebase function logs in the console
2. Verify your request body matches the expected format
3. Test with the simple example first (just title + description)
4. Make sure you're using the correct endpoint URL

Good luck! 🚀
