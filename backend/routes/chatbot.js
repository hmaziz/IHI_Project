const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const riskCalculator = require('../utils/riskCalculator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Store conversation context (in production, use a proper database)
const conversationContexts = new Map();

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot and get AI-generated response
 */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId, patientData, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation context
    let context = conversationContexts.get(sessionId) || {
      collectedData: {},
      questionsAsked: [],
      currentPhase: 'introduction'
    };

    // Update context with patient data if provided
    if (patientData) {
      context.collectedData = { ...context.collectedData, ...patientData };
    }

    // Build context-aware prompt
    const systemPrompt = buildSystemPrompt(context);
    const userMessages = buildConversationMessages(conversationHistory, message, context);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...userMessages
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0].message.content;

    // Update conversation context
    context.lastResponse = aiResponse;
    conversationContexts.set(sessionId, context);

    // Check if we have enough data for risk assessment
    const hasEnoughData = checkDataCompleteness(context.collectedData);
    let riskAssessment = null;
    let recommendations = null;

    if (hasEnoughData && context.currentPhase === 'data_collection') {
      riskAssessment = riskCalculator.calculateRisk(context.collectedData);
      recommendations = riskCalculator.generateRecommendations(riskAssessment, context.collectedData);
      context.currentPhase = 'results';
    }

    res.json({
      response: aiResponse,
      sessionId,
      hasEnoughData,
      riskAssessment,
      recommendations,
      collectedData: context.collectedData
    });
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({
      error: 'Failed to process chatbot message',
      message: error.message
    });
  }
});

/**
 * POST /api/chatbot/start
 * Initialize a new chatbot session
 */
router.post('/start', (req, res) => {
  const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const context = {
    collectedData: {},
    questionsAsked: [],
    currentPhase: 'introduction',
    createdAt: new Date().toISOString()
  };

  conversationContexts.set(sessionId, context);

  res.json({
    sessionId,
    welcomeMessage: "Hello! I'm here to help you assess your risk for heart disease. I'll ask you some questions about your health, lifestyle, and family history. Let's start with a simple question: What's your age?",
    currentPhase: 'introduction'
  });
});

/**
 * POST /api/chatbot/calculate-risk
 * Calculate risk based on collected data
 */
router.post('/calculate-risk', (req, res) => {
  try {
    const { patientData } = req.body;

    if (!patientData) {
      return res.status(400).json({ error: 'Patient data is required' });
    }

    const riskAssessment = riskCalculator.calculateRisk(patientData);
    const recommendations = riskCalculator.generateRecommendations(riskAssessment, patientData);

    res.json({
      success: true,
      riskAssessment,
      recommendations
    });
  } catch (error) {
    console.error('Error calculating risk:', error);
    res.status(500).json({
      error: 'Failed to calculate risk',
      message: error.message
    });
  }
});

/**
 * Build system prompt for OpenAI based on conversation context
 */
function buildSystemPrompt(context) {
  return `You are a friendly and empathetic healthcare assistant helping users assess their risk for heart disease. 
Your goal is to:
1. Collect health information through natural conversation (age, gender, blood pressure, cholesterol, lifestyle factors, family history, etc.)
2. Be supportive and non-judgmental
3. Ask one question at a time
4. Explain medical terms in simple language
5. Guide users toward understanding their risk factors

Current phase: ${context.currentPhase}
Data collected so far: ${JSON.stringify(context.collectedData, null, 2)}

Keep responses concise (2-3 sentences) and friendly. Always ask follow-up questions to gather more information unless the user explicitly asks for results.`;
}

/**
 * Build conversation messages for OpenAI API
 */
function buildConversationMessages(history, currentMessage, context) {
  const messages = [];

  // Add recent conversation history (last 10 messages)
  const recentHistory = history.slice(-10);
  recentHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  });

  // Add current message
  messages.push({ role: 'user', content: currentMessage });

  return messages;
}

/**
 * Check if we have enough data for risk assessment
 */
function checkDataCompleteness(collectedData) {
  const essentialFields = ['age', 'gender'];
  const importantFields = ['systolicBP', 'cholesterol', 'smoking', 'physicalActivity'];
  
  const hasEssential = essentialFields.every(field => collectedData[field] !== undefined);
  const hasImportant = importantFields.some(field => collectedData[field] !== undefined);
  
  return hasEssential && hasImportant;
}

module.exports = router;

