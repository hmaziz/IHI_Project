const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
const riskCalculator = require('../utils/riskCalculator');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN);
// Primary model (GGUF - may require local execution)
const MODEL_NAME = 'featherless-ai-quants/nztinversive-llama3.2-1B-HeartDiseasePrediction-GGUF';
// Healthcare-specific heart disease model
const HEART_DISEASE_MODEL = process.env.HEART_DISEASE_MODEL || 'Sarah0022/heart-disease-model';
// Fallback generic LLM for better conversational responses (available via Inference API)
// Options: 'microsoft/DialoGPT-medium', 'gpt2', 'mistralai/Mistral-7B-Instruct-v0.2', 'meta-llama/Meta-Llama-3.1-8B-Instruct'
const FALLBACK_LLM = process.env.FALLBACK_LLM_MODEL || 'microsoft/DialoGPT-medium';
const USE_GENERIC_LLM = process.env.USE_GENERIC_LLM === 'true';
const USE_HEART_DISEASE_MODEL = process.env.USE_HEART_DISEASE_MODEL !== 'false'; // Default to true

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

    // Check if user wants to proceed with risk calculation first
    // (before trying to get AI response or asking more questions)
    const hasEnoughData = checkDataCompleteness(context.collectedData);
    const nextQuestion = getNextQuestion(context);
    
    // If we have enough data and user confirms, proceed to calculation
    if (hasEnoughData && !nextQuestion && context.waitingForConfirmation) {
      const lowerMessage = message.toLowerCase().trim();
      if (wantsToProceed(message)) {
        // User confirmed - calculate risk
        try {
          // Use Sarah0022 model if enabled (or can be controlled via env var)
          const riskAssessment = await riskCalculator.calculateRisk(
            context.collectedData, 
            false, 
            USE_HEART_DISEASE_MODEL
          );
          const recommendations = riskCalculator.generateRecommendations(riskAssessment, context.collectedData);
          context.currentPhase = 'results';
          context.waitingForConfirmation = false;
          conversationContexts.set(sessionId, context);
          
          // Ensure all data fields are included for proper display
          const completeData = {
            age: context.collectedData.age !== undefined ? context.collectedData.age : undefined,
            gender: context.collectedData.gender !== undefined ? context.collectedData.gender : undefined,
            systolicBP: context.collectedData.systolicBP !== undefined ? context.collectedData.systolicBP : undefined,
            diastolicBP: context.collectedData.diastolicBP !== undefined ? context.collectedData.diastolicBP : undefined,
            cholesterol: context.collectedData.cholesterol !== undefined ? context.collectedData.cholesterol : undefined,
            hdlCholesterol: context.collectedData.hdlCholesterol !== undefined ? context.collectedData.hdlCholesterol : undefined,
            diabetes: context.collectedData.diabetes !== undefined ? context.collectedData.diabetes : undefined,
            smoking: context.collectedData.smoking !== undefined ? context.collectedData.smoking : undefined,
            familyHistory: context.collectedData.familyHistory !== undefined ? context.collectedData.familyHistory : undefined,
            physicalActivity: context.collectedData.physicalActivity !== undefined ? context.collectedData.physicalActivity : undefined,
            bmi: context.collectedData.bmi !== undefined ? context.collectedData.bmi : undefined,
            dietQuality: context.collectedData.dietQuality !== undefined ? context.collectedData.dietQuality : undefined
          };
          
          return res.json({
            response: "Great! I've calculated your heart disease risk assessment. Here are your results:",
            sessionId,
            hasEnoughData: true,
            riskAssessment,
            recommendations,
            collectedData: completeData
          });
        } catch (error) {
          console.error('Error calculating risk:', error);
          return res.status(500).json({
            error: 'Failed to calculate risk',
            message: error.message
          });
        }
      } else if (doesntWantToProceed(message)) {
        context.waitingForConfirmation = false;
        conversationContexts.set(sessionId, context);
        return res.json({
          response: "No problem! You can always come back to calculate your risk assessment later. Is there anything else I can help you with?",
          sessionId,
          hasEnoughData: true,
          riskAssessment: null,
          recommendations: null,
          collectedData: context.collectedData
        });
      }
    }

    // Build context-aware prompt
    const systemPrompt = buildSystemPrompt(context);
    const userMessages = buildConversationMessages(conversationHistory, message, context);
    
    // Build full prompt for Hugging Face model
    const fullPrompt = buildFullPrompt(systemPrompt, userMessages);

    // Call Hugging Face Inference API
    let aiResponse;
    
    // Try generic LLM first if enabled
    if (USE_GENERIC_LLM) {
      try {
        // Try chatCompletion first (preferred for conversational models)
        const result = await hf.chatCompletion({
          model: FALLBACK_LLM,
          messages: [
            { role: 'system', content: systemPrompt },
            ...userMessages
          ],
          temperature: 0.7,
          max_tokens: 500,
        });
        
        aiResponse = result.choices[0].message.content;
        console.log('✓ Generic LLM response received');
      } catch (llmError) {
        console.log('Generic LLM chatCompletion failed, trying textGeneration...', llmError.message);
        
        // Fallback to textGeneration if chatCompletion doesn't work
        try {
          const textResult = await hf.textGeneration({
            model: FALLBACK_LLM,
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              return_full_text: false,
              top_p: 0.9,
            },
          });
          
          aiResponse = textResult.generated_text.trim();
          console.log('✓ Generic LLM textGeneration response received');
        } catch (textError) {
          console.error('Generic LLM textGeneration also failed, trying specialized model...', textError.message);
          // Fall through to try specialized model or fallback
        }
      }
    }
    
    // If generic LLM didn't work or isn't enabled, try specialized model
    if (!aiResponse) {
      try {
        const result = await hf.textGeneration({
          model: MODEL_NAME,
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false,
            top_p: 0.9,
          },
        });
        
        aiResponse = result.generated_text.trim();
      } catch (error) {
        // If Inference API doesn't work, try chat completion endpoint
        console.log('Trying alternative endpoint...');
        try {
          const result = await hf.chatCompletion({
            model: MODEL_NAME,
            messages: [
              { role: 'system', content: systemPrompt },
              ...userMessages
            ],
            temperature: 0.7,
            max_tokens: 500,
          });
          
          aiResponse = result.choices[0].message.content;
        } catch (chatError) {
          // If model is not available via API, use improved rule-based fallback
          console.error('Hugging Face API error:', chatError.message);
          console.log('Using improved rule-based fallback system');
          aiResponse = generateFallbackResponse(context, message);
        }
      }
    }

    // Update conversation context
    context.lastResponse = aiResponse;
    conversationContexts.set(sessionId, context);

    // Check if we have enough data for risk assessment
    let riskAssessment = null;
    let recommendations = null;

    // Check if user wants to calculate risk or if we automatically should
    const shouldCalculateNow = (hasEnoughData && context.currentPhase === 'data_collection') || 
                               context.shouldCalculateRisk;
    
    if (shouldCalculateNow && hasEnoughData) {
      try {
        // Use Sarah0022 model if enabled
        riskAssessment = await riskCalculator.calculateRisk(
          context.collectedData, 
          false, 
          USE_HEART_DISEASE_MODEL
        );
        recommendations = riskCalculator.generateRecommendations(riskAssessment, context.collectedData);
        context.currentPhase = 'results';
        context.shouldCalculateRisk = false; // Reset flag
        
        // If the response was just asking to proceed, update it with the calculation message
        if (context.waitingForConfirmation && wantsToProceed(message)) {
          aiResponse = "Great! I've calculated your heart disease risk assessment. Here are your results:";
        }
      } catch (error) {
        console.error('Error calculating risk:', error);
        // Don't fail the response, just log the error
      }
    }

    // Ensure all data fields are included for proper display in summary
    const completeData = {
      age: context.collectedData.age !== undefined ? context.collectedData.age : undefined,
      gender: context.collectedData.gender !== undefined ? context.collectedData.gender : undefined,
      systolicBP: context.collectedData.systolicBP !== undefined ? context.collectedData.systolicBP : undefined,
      diastolicBP: context.collectedData.diastolicBP !== undefined ? context.collectedData.diastolicBP : undefined,
      cholesterol: context.collectedData.cholesterol !== undefined ? context.collectedData.cholesterol : undefined,
      hdlCholesterol: context.collectedData.hdlCholesterol !== undefined ? context.collectedData.hdlCholesterol : undefined,
      diabetes: context.collectedData.diabetes !== undefined ? context.collectedData.diabetes : undefined,
      smoking: context.collectedData.smoking !== undefined ? context.collectedData.smoking : undefined,
      familyHistory: context.collectedData.familyHistory !== undefined ? context.collectedData.familyHistory : undefined,
      physicalActivity: context.collectedData.physicalActivity !== undefined ? context.collectedData.physicalActivity : undefined,
      bmi: context.collectedData.bmi !== undefined ? context.collectedData.bmi : undefined,
      dietQuality: context.collectedData.dietQuality !== undefined ? context.collectedData.dietQuality : undefined
    };
    
    res.json({
      response: aiResponse,
      sessionId,
      hasEnoughData,
      riskAssessment,
      recommendations,
      collectedData: completeData
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
    welcomeMessage: "Hello! I'm here to help you assess your risk for heart disease. I'll ask you some questions about your health, lifestyle, and family history. If you don't know an answer, just say 'I don't know' and we can skip it. Let's start: What's your age?",
    currentPhase: 'introduction'
  });
});

/**
 * GET /api/chatbot/test-sarah-model
 * Test Sarah0022/heart-disease-model availability
 */
router.get('/test-sarah-model', async (req, res) => {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    
    if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
      return res.status(400).json({
        success: false,
        error: 'Hugging Face API key not configured',
        message: 'Please set HUGGINGFACE_API_KEY or HF_TOKEN in your .env file'
      });
    }

    // Import and test the heart disease model
    const HeartDiseaseModel = require('../utils/heartDiseaseModel');
    const model = new HeartDiseaseModel(apiKey);

    // Test with sample data
    const testData = {
      age: 45,
      gender: 'male',
      systolicBP: 120,
      diastolicBP: 80,
      cholesterol: 200,
      hdlCholesterol: 50
    };

    try {
      const result = await model.getRiskAssessment(testData);
      
      res.json({
        success: true,
        message: 'Sarah0022/heart-disease-model is working',
        modelName: 'Sarah0022/heart-disease-model',
        testResult: {
          riskPercentage: result.riskPercentage,
          category: result.category,
          riskScore: result.riskScore
        },
        timestamp: new Date().toISOString()
      });
    } catch (modelError) {
      if (modelError.status === 401 || modelError.statusCode === 401) {
        return res.status(401).json({
          success: false,
          error: 'Hugging Face API key is invalid or unauthorized',
          message: 'Please check your API key. Get one at https://huggingface.co/settings/tokens'
        });
      } else if (modelError.status === 404 || modelError.statusCode === 404 || 
                 modelError.message?.includes('404')) {
        return res.status(404).json({
          success: false,
          error: 'Model not found via Inference API',
          message: `Model ${model.modelName} may not be available via Inference API. It may require local execution or a different access method.`,
          note: 'The API key is valid, but the model may require different setup.'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to access model',
          message: modelError.message,
          note: 'The model may not be available via Inference API or may require different input format.'
        });
      }
    }
  } catch (error) {
    console.error('Error testing Sarah0022 model:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Sarah0022 model',
      message: error.message
    });
  }
});

/**
 * GET /api/chatbot/test-huggingface
 * Test Hugging Face API key validity and model availability
 */
router.get('/test-huggingface', async (req, res) => {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    
    if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
      return res.status(400).json({
        success: false,
        error: 'Hugging Face API key not configured',
        message: 'Please set HUGGINGFACE_API_KEY or HF_TOKEN in your .env file'
      });
    }

    // Test API key by making a simple API call
    try {
      // Try text generation first
      const result = await hf.textGeneration({
        model: MODEL_NAME,
        inputs: 'Hello',
        parameters: {
          max_new_tokens: 10,
          return_full_text: false,
        },
      });

      res.json({
        success: true,
        message: 'Hugging Face API key is valid and model is accessible',
        apiKeyConfigured: true,
        modelName: MODEL_NAME,
        testResponse: result.generated_text ? result.generated_text.trim() : 'Model responded successfully',
        timestamp: new Date().toISOString()
      });
    } catch (apiError) {
      // If textGeneration doesn't work, try chatCompletion
      try {
        const chatResult = await hf.chatCompletion({
          model: MODEL_NAME,
          messages: [{ role: 'user', content: 'Say "test"' }],
          max_tokens: 10,
        });

        res.json({
          success: true,
          message: 'Hugging Face API key is valid (chat endpoint)',
          apiKeyConfigured: true,
          modelName: MODEL_NAME,
          testResponse: chatResult.choices[0].message.content,
          timestamp: new Date().toISOString()
        });
      } catch (chatError) {
        // Check for specific errors
        if (apiError.status === 401 || chatError.status === 401) {
          return res.status(401).json({
            success: false,
            error: 'Hugging Face API key is invalid or unauthorized',
            message: 'Please check your API key. Get one at https://huggingface.co/settings/tokens'
          });
        } else if (apiError.status === 429 || chatError.status === 429) {
          return res.status(429).json({
            success: false,
            error: 'Hugging Face API rate limit exceeded',
            message: 'Please try again later'
          });
        } else if (apiError.message && apiError.message.includes('404') || chatError.message && chatError.message.includes('404')) {
          return res.status(404).json({
            success: false,
            error: 'Model not found via Inference API',
            message: `Model ${MODEL_NAME} may not be available via Inference API. GGUF models may need to be run locally with llama.cpp.`,
            note: 'The API key is valid, but the model may require local execution.'
          });
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to access model',
            message: apiError.message || chatError.message,
            note: 'The model may not be available via Inference API. GGUF models typically need local execution.'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error testing Hugging Face:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Hugging Face connection',
      message: error.message
    });
  }
});

/**
 * POST /api/chatbot/calculate-risk
 * Calculate risk based on collected data
 */
router.post('/calculate-risk', async (req, res) => {
  try {
    const { patientData } = req.body;

    if (!patientData) {
      return res.status(400).json({ error: 'Patient data is required' });
    }

    // Use Sarah0022 model if enabled
    const riskAssessment = await riskCalculator.calculateRisk(
      patientData, 
      false, 
      USE_HEART_DISEASE_MODEL
    );
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
 * Build system prompt for Hugging Face model based on conversation context
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
 * Build conversation messages for Hugging Face API
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
 * Build full prompt for text generation models
 */
function buildFullPrompt(systemPrompt, messages) {
  let prompt = systemPrompt + '\n\n';
  
  messages.forEach(msg => {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n`;
    }
  });
  
  prompt += 'Assistant:';
  return prompt;
}

/**
 * Health metric questions with ranges
 */
const HEALTH_QUESTIONS = {
  age: {
    question: "What's your age?",
    field: 'age',
    next: 'gender'
  },
  gender: {
    question: "What's your gender? (male or female)",
    field: 'gender',
    next: 'systolicBP'
  },
  systolicBP: {
    question: "What's your systolic blood pressure (the top number)? Normal range: 90-140 mmHg. You can say 'I don't know' if unsure.",
    field: 'systolicBP',
    next: 'diastolicBP',
    range: '90-140 mmHg'
  },
  diastolicBP: {
    question: "What's your diastolic blood pressure (the bottom number)? Normal range: 60-90 mmHg. You can say 'I don't know' if unsure.",
    field: 'diastolicBP',
    next: 'cholesterol',
    range: '60-90 mmHg'
  },
  cholesterol: {
    question: "What's your total cholesterol level? Normal range: 125-200 mg/dL. You can say 'I don't know' if unsure.",
    field: 'cholesterol',
    next: 'hdlCholesterol',
    range: '125-200 mg/dL'
  },
  hdlCholesterol: {
    question: "What's your HDL cholesterol level (the 'good' cholesterol)? Normal range: 40-60 mg/dL. You can say 'I don't know' if unsure.",
    field: 'hdlCholesterol',
    next: 'smoking',
    range: '40-60 mg/dL'
  },
  smoking: {
    question: "Do you smoke? (current, former, or never). You can say 'I don't know' if unsure.",
    field: 'smoking',
    next: 'physicalActivity'
  },
  physicalActivity: {
    question: "How much physical activity do you get? (sedentary, moderate, or active). You can say 'I don't know' if unsure.",
    field: 'physicalActivity',
    next: 'diabetes'
  },
  diabetes: {
    question: "Do you have diabetes? (yes or no). You can say 'I don't know' if unsure.",
    field: 'diabetes',
    next: 'familyHistory'
  },
  familyHistory: {
    question: "Do you have a family history of heart disease? (yes or no). You can say 'I don't know' if unsure.",
    field: 'familyHistory',
    next: 'bmi'
  },
  bmi: {
    question: "What's your BMI or approximate weight and height? Normal BMI range: 18.5-24.9. You can say 'I don't know' if unsure.",
    field: 'bmi',
    next: 'dietQuality',
    range: '18.5-24.9'
  },
  dietQuality: {
    question: "How would you rate your diet quality? (poor, fair, good, or excellent). You can say 'I don't know' if unsure.",
    field: 'dietQuality',
    next: 'complete'
  }
};

/**
 * Check if user said they don't know
 */
function isUnknownResponse(message) {
  const lowerMessage = message.toLowerCase().trim();
  const unknownPhrases = [
    "don't know", "dont know", "don't know", "i don't know",
    "i dont know", "unsure", "i'm unsure", "im unsure",
    "not sure", "i'm not sure", "im not sure", "no idea",
    "i don't have that", "dont have that", "don't have that",
    "skip", "pass", "unknown"
  ];
  return unknownPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user wants to proceed with risk calculation
 */
function wantsToProceed(message) {
  const lowerMessage = message.toLowerCase().trim();
  const proceedPhrases = [
    "yes", "yeah", "yep", "sure", "ok", "okay", "proceed",
    "go ahead", "calculate", "please", "let's do it",
    "do it", "continue", "yes please", "okay proceed",
    "calculate my risk", "show me my risk", "i want to see my risk"
  ];
  return proceedPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Check if user doesn't want to proceed
 */
function doesntWantToProceed(message) {
  const lowerMessage = message.toLowerCase().trim();
  const noPhrases = [
    "no", "nope", "not now", "later", "maybe later",
    "don't", "don't want", "skip", "not yet"
  ];
  return noPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Get the next question to ask based on collected data
 */
function getNextQuestion(context) {
  // Check in order - ask all questions to match questionnaire
  if (!context.collectedData.age) return HEALTH_QUESTIONS.age;
  if (!context.collectedData.gender) return HEALTH_QUESTIONS.gender;
  if (context.collectedData.systolicBP === undefined && context.collectedData.systolicBP !== null) return HEALTH_QUESTIONS.systolicBP;
  if (context.collectedData.diastolicBP === undefined && context.collectedData.diastolicBP !== null) return HEALTH_QUESTIONS.diastolicBP;
  if (context.collectedData.cholesterol === undefined && context.collectedData.cholesterol !== null) return HEALTH_QUESTIONS.cholesterol;
  if (context.collectedData.hdlCholesterol === undefined && context.collectedData.hdlCholesterol !== null) return HEALTH_QUESTIONS.hdlCholesterol;
  if (context.collectedData.smoking === undefined && context.collectedData.smoking !== null) return HEALTH_QUESTIONS.smoking;
  if (context.collectedData.physicalActivity === undefined && context.collectedData.physicalActivity !== null) return HEALTH_QUESTIONS.physicalActivity;
  if (context.collectedData.diabetes === undefined) return HEALTH_QUESTIONS.diabetes;
  if (context.collectedData.familyHistory === undefined) return HEALTH_QUESTIONS.familyHistory;
  if (context.collectedData.bmi === undefined && context.collectedData.bmi !== null) return HEALTH_QUESTIONS.bmi;
  if (context.collectedData.dietQuality === undefined && context.collectedData.dietQuality !== null) return HEALTH_QUESTIONS.dietQuality;
  return null; // All questions asked
}

/**
 * Parse health metric from message
 */
function parseHealthMetric(message, field) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for unknown first
  if (isUnknownResponse(message)) {
    return null; // Return null to indicate "I don't know"
  }
  
  // Extract numbers
  const numbers = message.match(/\d+/g);
  
  switch(field) {
    case 'age':
      if (numbers) {
        const age = parseInt(numbers[0]);
        if (age >= 0 && age <= 150) return age;
      }
      break;
      
    case 'systolicBP':
      if (numbers) {
        const bp = parseInt(numbers[0]);
        if (bp >= 70 && bp <= 250) return bp;
      }
      break;
      
    case 'diastolicBP':
      if (numbers) {
        const bp = parseInt(numbers[0]);
        if (bp >= 40 && bp <= 150) return bp;
      }
      break;
      
    case 'cholesterol':
      if (numbers) {
        const chol = parseInt(numbers[0]);
        if (chol >= 50 && chol <= 500) return chol;
      }
      break;
      
    case 'hdlCholesterol':
      if (numbers) {
        const hdl = parseInt(numbers[0]);
        if (hdl >= 10 && hdl <= 150) return hdl;
      }
      break;
      
    case 'smoking':
      if (lowerMessage.includes('current') || lowerMessage.includes('yes') && !lowerMessage.includes('never')) {
        return 'current';
      } else if (lowerMessage.includes('former') || lowerMessage.includes('used to')) {
        return 'former';
      } else if (lowerMessage.includes('never') || lowerMessage.includes('no') && !lowerMessage.includes('current')) {
        return 'never';
      }
      break;
      
    case 'physicalActivity':
      if (lowerMessage.includes('sedentary') || lowerMessage.includes('little') || lowerMessage.includes('none')) {
        return 'sedentary';
      } else if (lowerMessage.includes('moderate') || lowerMessage.includes('some')) {
        return 'moderate';
      } else if (lowerMessage.includes('active') || lowerMessage.includes('regular') || lowerMessage.includes('lots')) {
        return 'active';
      }
      break;
      
    case 'diabetes':
      if (lowerMessage.includes('yes') || lowerMessage.includes('have') && !lowerMessage.includes('no')) {
        return true;
      } else if (lowerMessage.includes('no') || lowerMessage.includes("don't")) {
        return false;
      }
      break;
      
    case 'familyHistory':
      if (lowerMessage.includes('yes') || lowerMessage.includes('have') && !lowerMessage.includes('no')) {
        return true;
      } else if (lowerMessage.includes('no') || lowerMessage.includes("don't")) {
        return false;
      }
      break;
      
    case 'gender':
      if (lowerMessage.includes('female') || lowerMessage.includes('woman') || 
          lowerMessage.match(/\bf\b/) || lowerMessage === 'f' || 
          lowerMessage.includes('girl') || lowerMessage.includes('she')) {
        return 'female';
      } else if (lowerMessage.includes('male') || lowerMessage.includes('man') || 
                 lowerMessage.match(/\bm\b/) || lowerMessage === 'm' ||
                 lowerMessage.includes('boy') || lowerMessage.includes('he')) {
        return 'male';
      }
      break;
      
    case 'bmi':
      if (numbers && numbers.length >= 1) {
        const bmi = parseFloat(numbers[0]);
        if (bmi >= 10 && bmi <= 60) return bmi;
        // If two numbers provided, calculate BMI: weight (kg) and height (cm)
        if (numbers.length >= 2) {
          const weight = parseFloat(numbers[0]);
          const height = parseFloat(numbers[1]);
          if (weight >= 30 && weight <= 200 && height >= 100 && height <= 250) {
            // BMI = weight (kg) / (height (m))^2
            const heightM = height / 100;
            return weight / (heightM * heightM);
          }
        }
      }
      break;
      
    case 'dietQuality':
      if (lowerMessage.includes('poor') || lowerMessage.includes('bad')) {
        return 'poor';
      } else if (lowerMessage.includes('fair') || lowerMessage.includes('average')) {
        return 'fair';
      } else if (lowerMessage.includes('good') || lowerMessage.includes('healthy')) {
        return 'good';
      } else if (lowerMessage.includes('excellent') || lowerMessage.includes('great')) {
        return 'excellent';
      }
      break;
  }
  
  return undefined; // Could not parse
}

/**
 * Generate fallback response when model is not available
 */
function generateFallbackResponse(context, message) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check if we have enough data first
  const hasEnoughData = checkDataCompleteness(context.collectedData);
  
  // If we have enough data and user is waiting for confirmation, handle their response
  if (hasEnoughData && context.waitingForConfirmation) {
    // User already asked, now they're responding
    if (wantsToProceed(message)) {
      // Mark that risk calculation should happen
      context.shouldCalculateRisk = true;
      context.waitingForConfirmation = false;
      return "Perfect! I'll calculate your heart disease risk assessment now. Please wait a moment...";
    } else if (doesntWantToProceed(message)) {
      context.waitingForConfirmation = false;
      return "No problem! You can always come back to calculate your risk assessment later. Is there anything else I can help you with?";
    } else {
      // Unclear response, ask again
      return "I didn't quite understand. Would you like me to calculate your heart disease risk assessment now? Please say 'yes' to proceed or 'no' to skip.";
    }
  }
  
  // If we have enough data but haven't asked yet, ask if they want to proceed
  if (hasEnoughData && !context.waitingForConfirmation) {
    context.waitingForConfirmation = true;
    return "Thank you for providing all that information! I have enough data to calculate your risk. Would you like me to proceed with the risk assessment?";
  }
  
  // Get current question based on what's missing (only if we don't have enough data)
  const currentQuestion = getNextQuestion(context);
  
  if (!currentQuestion) {
    // All questions answered but not enough data - shouldn't happen, but handle gracefully
    context.waitingForConfirmation = true;
    return "Thank you for providing that information! I have enough data to calculate your risk. Would you like me to proceed with the risk assessment?";
  }
  
  // Try to extract the answer
  const field = currentQuestion.field;
  const value = parseHealthMetric(message, field);
  
  // Handle "I don't know" responses
  if (isUnknownResponse(message)) {
    context.collectedData[field] = null; // Set to null to indicate "don't know"
    const nextQuestion = getNextQuestion(context);
    if (nextQuestion) {
      return `That's okay! We can skip that for now. ${nextQuestion.question}`;
    } else {
      return "Thank you for all your answers! I have enough information. Would you like me to calculate your risk assessment now?";
    }
  }
  
  // If we got a valid value
  if (value !== undefined) {
    context.collectedData[field] = value;
    
    // Get next question
    const nextQuestion = getNextQuestion(context);
    
    if (!nextQuestion) {
      return "Great! I have all the information I need. Would you like me to calculate your heart disease risk assessment now?";
    }
    
    // Acknowledge and ask next question
    let acknowledgment = `Thank you! I've noted that. `;
    if (field === 'age') {
      acknowledgment = `Thank you! I've noted your age as ${value}. `;
    } else if (field === 'gender') {
      acknowledgment = `Got it, ${value}. `;
    } else if (field === 'systolicBP') {
      acknowledgment = `Thank you! I've recorded your systolic blood pressure as ${value} mmHg. `;
    } else if (field === 'diastolicBP') {
      acknowledgment = `Thank you! I've recorded your diastolic blood pressure as ${value} mmHg. `;
    } else if (field === 'cholesterol') {
      acknowledgment = `Thank you! I've recorded your total cholesterol as ${value} mg/dL. `;
    } else if (field === 'hdlCholesterol') {
      acknowledgment = `Thank you! I've recorded your HDL cholesterol as ${value} mg/dL. `;
    } else if (field === 'dietQuality') {
      acknowledgment = `Thank you! I've noted your diet quality as ${value}. `;
    }
    
    return acknowledgment + nextQuestion.question;
  }
  
  // Could not parse, ask for clarification
  return `I'm sorry, I didn't understand that. ${currentQuestion.question}`;
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

