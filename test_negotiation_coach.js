// Test script for Negotiation Coach API
const fetch = require('node-fetch');

const FUNCTION_URL = 'https://us-central1-barterbrain-1254a.cloudfunctions.net/BarterBrainAPI/ai/negotiationCoach';

// Test cases
const testCases = [
  {
    name: 'iPhone for Laptop - User wants cash adjustment',
    data: {
      userItem: {
        title: 'iPhone 13 Pro',
        description: '256GB, good condition',
        estimatedValue: 535,
        condition: 'good'
      },
      otherUserItem: {
        title: 'MacBook Air M1',
        description: '2020 model, 8GB RAM, 256GB SSD',
        estimatedValue: 650,
        condition: 'excellent'
      },
      currentOffer: {
        cashAdjustment: 0,
        status: 'negotiating'
      },
      chatTranscript: [
        { message: 'Hey! Interested in your MacBook', isCurrentUser: true },
        { message: 'Cool! What are you offering?', isCurrentUser: false },
        { message: 'I have an iPhone 13 Pro, 256GB', isCurrentUser: true },
        { message: 'Hmm, not sure if that\'s a fair trade', isCurrentUser: false },
        { message: 'It\'s in really good condition!', isCurrentUser: true },
        { message: 'But MacBooks hold value better', isCurrentUser: false }
      ]
    }
  },
  {
    name: 'Textbook swap - seems fair',
    data: {
      userItem: {
        title: 'Calculus Early Transcendentals 8th Ed',
        description: 'Minimal highlighting',
        estimatedValue: 36,
        condition: 'good'
      },
      otherUserItem: {
        title: 'Physics for Scientists and Engineers',
        description: 'Good condition, some notes',
        estimatedValue: 40,
        condition: 'good'
      },
      chatTranscript: [
        { message: 'Hi! Need a physics book?', isCurrentUser: true },
        { message: 'Actually yes! I have a calculus book', isCurrentUser: false },
        { message: 'Perfect, I need that for next semester', isCurrentUser: true },
        { message: 'Want to swap straight up?', isCurrentUser: false },
        { message: 'Sounds good but let me think', isCurrentUser: true }
      ]
    }
  },
  {
    name: 'Gaming console negotiation - other user lowballing',
    data: {
      userItem: {
        title: 'PlayStation 5 Digital',
        description: 'Barely used, 6 months old',
        estimatedValue: 359,
        condition: 'excellent'
      },
      otherUserItem: {
        title: 'Nintendo Switch',
        description: '2019 model with scratches',
        estimatedValue: 180,
        condition: 'fair'
      },
      currentOffer: {
        cashAdjustment: -50,
        status: 'negotiating'
      },
      chatTranscript: [
        { message: 'Interested in trading for my Switch?', isCurrentUser: false },
        { message: 'Maybe, but there\'s a big value difference', isCurrentUser: true },
        { message: 'I can add $50', isCurrentUser: false },
        { message: 'That still seems low for a PS5', isCurrentUser: true },
        { message: 'It\'s the best I can do', isCurrentUser: false }
      ]
    }
  },
  {
    name: 'Bike for furniture - creative swap',
    data: {
      userItem: {
        title: 'Mountain Bike',
        description: 'Trek Marlin 5, good condition',
        estimatedValue: 280,
        condition: 'good'
      },
      otherUserItem: {
        title: 'IKEA Desk and Chair Set',
        description: 'Used for 1 year, moving out',
        estimatedValue: 120,
        condition: 'good'
      },
      chatTranscript: [
        { message: 'Need furniture for my new place', isCurrentUser: true },
        { message: 'I have a desk and chair!', isCurrentUser: false },
        { message: 'What would you want for it?', isCurrentUser: true },
        { message: 'Do you have a bike? I need one for campus', isCurrentUser: false },
        { message: 'I do, but a bike is worth more', isCurrentUser: true },
        { message: 'True... what do you think is fair?', isCurrentUser: false }
      ]
    }
  }
];

async function testNegotiationCoach(testCase) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`${'='.repeat(70)}`);
  console.log('\n📊 Context:');
  console.log(`   Your item: ${testCase.data.userItem.title} (~$${testCase.data.userItem.estimatedValue})`);
  console.log(`   Their item: ${testCase.data.otherUserItem.title} (~$${testCase.data.otherUserItem.estimatedValue})`);
  console.log(`\n💬 Recent conversation:`);
  testCase.data.chatTranscript.slice(-3).forEach(msg => {
    const sender = msg.isCurrentUser ? '   YOU' : '   THEM';
    console.log(`${sender}: ${msg.message}`);
  });
  
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
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }
    
    const result = await response.json();
    
    console.log(`\n✅ AI Coach Response (${elapsed}ms):\n`);
    console.log(`💡 Suggested Message:`);
    console.log(`   "${result.suggestionPhrase}"\n`);
    
    console.log(`💰 Suggested Cash Adjustment: $${result.suggestedCashAdjustment}`);
    if (result.suggestedCashAdjustment > 0) {
      console.log(`   (You should offer to pay this amount)`);
    } else if (result.suggestedCashAdjustment < 0) {
      console.log(`   (You should ask them to pay $${Math.abs(result.suggestedCashAdjustment)})`);
    } else {
      console.log(`   (Even swap suggested)`);
    }
    
    console.log(`\n📝 Explanation:`);
    console.log(`   ${result.explanation}\n`);
    
    if (result.negotiationTips && result.negotiationTips.length > 0) {
      console.log(`💭 Tips:`);
      result.negotiationTips.forEach((tip, idx) => {
        console.log(`   ${idx + 1}. ${tip}`);
      });
    }
    
    return { success: true, result, elapsed };
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🤖 Starting Negotiation Coach API Tests...\n');
  console.log(`Function URL: ${FUNCTION_URL}\n`);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testNegotiationCoach(testCase);
    results.push({ name: testCase.name, ...result });
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📈 Test Summary');
  console.log('='.repeat(70));
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const time = r.elapsed ? ` (${r.elapsed}ms)` : '';
    console.log(`${status} ${r.name}${time}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n${successCount}/${results.length} tests passed\n`);
}

// Run tests
runAllTests().catch(console.error);
