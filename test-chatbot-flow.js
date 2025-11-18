// Test script to simulate chatbot flow
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/chatbot';

async function testChatbotFlow() {
  try {
    console.log('=== Starting Chatbot Flow Test ===\n');
    
    // Step 1: Start session
    console.log('1. Starting session...');
    const startResponse = await axios.post(`${BASE_URL}/start`, {});
    const sessionId = startResponse.data.sessionId;
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   First question: ${startResponse.data.message}\n`);
    
    const QUESTION_FLOW = [
      'age', 'gender', 'systolicBP', 'diastolicBP', 'cholesterol',
      'hdlCholesterol', 'bmi', 'smoking', 'physicalActivity',
      'dietQuality', 'diabetes', 'familyHistory'
    ];
    
    const testAnswers = {
      age: '45',
      gender: 'male',
      systolicBP: '120',
      diastolicBP: '80',
      cholesterol: '200',
      hdlCholesterol: '50',
      bmi: '25',
      smoking: 'never',
      physicalActivity: 'moderate',
      dietQuality: 'good',
      diabetes: 'no',
      familyHistory: 'yes'
    };
    
    let currentIndex = 0;
    let collectedData = {};
    
    // Step 2: Answer all questions
    for (let i = 0; i < QUESTION_FLOW.length; i++) {
      const field = QUESTION_FLOW[i];
      const answer = testAnswers[field];
      
      console.log(`${i + 1}. Question ${i + 1}/${QUESTION_FLOW.length}: ${field}`);
      console.log(`   Answer: ${answer}`);
      
      const messageResponse = await axios.post(`${BASE_URL}/message`, {
        sessionId: sessionId,
        message: answer
      });
      
      collectedData = messageResponse.data.collectedData || {};
      console.log(`   Response: ${messageResponse.data.response}`);
      console.log(`   Collected data keys: ${Object.keys(collectedData).length}`);
      console.log(`   Has enough data: ${messageResponse.data.hasEnoughData || false}`);
      
      if (messageResponse.data.hasEnoughData) {
        console.log(`   ⚠️  WARNING: hasEnoughData is true at question ${i + 1}!`);
        console.log(`   Expected: Should only be true after all ${QUESTION_FLOW.length} questions`);
      }
      
      console.log('');
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('=== Test Complete ===');
    console.log(`Total questions answered: ${Object.keys(collectedData).length}`);
    console.log(`Expected questions: ${QUESTION_FLOW.length}`);
    console.log(`Collected fields: ${Object.keys(collectedData).join(', ')}`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testChatbotFlow();

