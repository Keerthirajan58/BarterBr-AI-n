// Test script for ProductPricePredictionApi Firebase Function
const fetch = require('node-fetch');

const FUNCTION_URL = 'https://us-central1-barterbrain-1254a.cloudfunctions.net/ProductPricePredictionApi/ai/metadataValuation';

// Test cases
const testCases = [
  {
    name: 'iPhone with images',
    data: {
      title: 'iPhone 13 Pro',
      description: 'Gently used iPhone 13 Pro, 256GB, Pacific Blue. Minor scratches on back.',
      category: 'Electronics',
      condition: 'good',
      ageMonths: 24,
      brand: 'Apple',
      accessories: ['Original Box', 'Charger', 'Case'],
      images: [
        'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800',
        'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800'
      ],
      productLink: 'https://www.apple.com/iphone-13-pro/'
    }
  },
  {
    name: 'Textbook without images',
    data: {
      title: 'Calculus Early Transcendentals',
      description: 'James Stewart 8th Edition. Minimal highlighting, good condition.',
      category: 'Books',
      condition: 'good',
      ageMonths: 12,
      brand: 'Cengage'
    }
  },
  {
    name: 'Gaming Console',
    data: {
      title: 'PlayStation 5',
      description: 'PS5 Digital Edition, barely used, perfect condition',
      category: 'Electronics',
      condition: 'excellent',
      ageMonths: 6,
      brand: 'Sony',
      accessories: ['Controller', 'HDMI Cable', 'Power Cable']
    }
  }
];

async function testFunction(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Request data:', JSON.stringify(testCase.data, null, 2));
  
  try {
    const startTime = Date.now();
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data)
    });
    
    const elapsed = Date.now() - startTime;
    const result = await response.json();
    
    console.log(`\n✅ Response (${elapsed}ms):`);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.value && result.confidence) {
      console.log(`\n📊 Summary:`);
      console.log(`   Value: $${result.value}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Explanation: ${result.explanation}`);
    }
    
    return { success: true, result, elapsed };
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting API tests...\n');
  console.log(`Function URL: ${FUNCTION_URL}\n`);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testFunction(testCase);
    results.push({ name: testCase.name, ...result });
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 Test Summary');
  console.log('='.repeat(60));
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const time = r.elapsed ? ` (${r.elapsed}ms)` : '';
    console.log(`${status} ${r.name}${time}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n${successCount}/${results.length} tests passed`);
}

// Run tests
runAllTests().catch(console.error);
