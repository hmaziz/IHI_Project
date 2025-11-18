const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
const riskCalculator = require('../utils/riskCalculator');
const axios = require('axios');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN);
const USE_AI_EXTRACTION = process.env.USE_AI_EXTRACTION !== 'false'; // Default to true
const FHIR_SERVER_URL = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';

// Conversation context store
const conversationContexts = new Map();

// Define the question flow in order
const QUESTION_FLOW = [
  'age',
  'gender',
  'systolicBP',
  'diastolicBP',
  'cholesterol',
  'hdlCholesterol',
  'bmi',
  'smoking',
  'physicalActivity',
  'dietQuality',
  'diabetes',
  'familyHistory',
];

// Map each field to a friendly question with ranges
const QUESTIONS = {
  age: "What's your age?",
  gender: "What's your gender? (male/female/other)",
  systolicBP: "What's your systolic blood pressure, the top number? (Normal: < 120 mmHg, Elevated: 120-129, High: ≥ 130 mmHg)",
  diastolicBP: "What's your diastolic blood pressure, the bottom number? (Normal: < 80 mmHg, Elevated: 80-89, High: ≥ 90 mmHg)",
  cholesterol: "What's your total cholesterol level? (Desirable: < 200 mg/dL, Borderline: 200-239, High: ≥ 240 mg/dL)",
  hdlCholesterol: "What's your HDL cholesterol (the 'good' cholesterol)? (Low risk: ≥ 60 mg/dL, Normal: 40-59, High risk: < 40 mg/dL)",
  bmi: "What's your BMI (Body Mass Index)? (Underweight: < 18.5, Normal: 18.5-24.9, Overweight: 25-29.9, Obese: ≥ 30). If you don't know your BMI, you can provide your weight and height.",
  smoking: "Do you smoke? (current/former/never)",
  physicalActivity: "How much physical activity do you get? (sedentary: little to no exercise, moderate: some regular exercise, active: regular exercise most days)",
  dietQuality: "How would you rate your diet quality? (poor: mostly processed foods, fair: mixed diet, good: mostly whole foods, excellent: very healthy balanced diet)",
  diabetes: "Do you have diabetes? (yes/no)",
  familyHistory: "Do you have a family history of heart disease? (yes/no - includes parents, siblings, or grandparents with heart disease)"
};

// Define events for state transitions
const EVENTS = {
  NEXT_QUESTION: 'NEXT_QUESTION',
  CALCULATE_RISK: 'CALCULATE_RISK',
  WAIT_CONFIRMATION: 'WAIT_CONFIRMATION'
};

// Initialize a new session
router.post('/start', (req, res) => {
  const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;

  conversationContexts.set(sessionId, {
    collectedData: {},
    currentQuestionIndex: 0,
    currentPhase: 'collectingData',
    waitingForConfirmation: false
  });

  res.json({
    sessionId,
    welcomeMessage: `Hello! I'm here to help you assess your risk for heart disease. Let's start with a simple question: ${QUESTIONS[QUESTION_FLOW[0]]}`,
    message: QUESTIONS[QUESTION_FLOW[0]]
  });
});

// Handle user messages
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message, conversationHistory = [] } = req.body;
    const context = conversationContexts.get(sessionId);

    if (!context) {
      return res.status(400).json({ error: 'Session not found. Start a new session.' });
    }

    // If waiting for confirmation to calculate risk
    if (context.waitingForConfirmation) {
      if (message.toLowerCase().includes('yes')) {
        context.currentPhase = 'calculatingRisk';
        context.waitingForConfirmation = false;
        const { riskAssessment, recommendations } = await calculateRisk(context.collectedData);
        context.currentPhase = 'completed';
        return res.json({
          response: "Great! Here's your heart disease risk assessment.",
          message: "Great! Here's your heart disease risk assessment.",
          riskAssessment,
          recommendations,
          collectedData: context.collectedData
        });
      } else {
        context.waitingForConfirmation = false;
        return res.json({
          response: "Okay, you can calculate your risk anytime later.",
          message: "Okay, you can calculate your risk anytime later.",
          collectedData: context.collectedData
        });
      }
    }

    // Parse user response for current question using AI first, then fallback
    const currentField = QUESTION_FLOW[context.currentQuestionIndex];
    console.log(`[DEBUG] Processing question ${context.currentQuestionIndex + 1}/${QUESTION_FLOW.length}: ${currentField}`);
    console.log(`[DEBUG] User message: "${message}"`);
    console.log(`[DEBUG] Current collected data: ${Object.keys(context.collectedData).length} fields`);
    
    let parsedValue = null;
    
    // For BMI, always try AI extraction first (it handles both direct numbers and height/weight)
    // For other fields, try AI if enabled
    if (currentField === 'bmi' || USE_AI_EXTRACTION) {
      try {
        parsedValue = await extractHealthDataWithAI(message, currentField, context);
        console.log(`[DEBUG] AI extraction result: ${parsedValue}`);
      } catch (aiError) {
        console.log('AI extraction error, using fallback:', aiError.message);
      }
    }
    
    // Fallback to rule-based parsing if AI didn't return a value
    if (parsedValue === null || parsedValue === undefined) {
      parsedValue = parseAnswer(message, currentField);
      console.log(`[DEBUG] Rule-based parsing result: ${parsedValue}`);
    }
    
    if (parsedValue !== undefined && parsedValue !== null) {
      context.collectedData[currentField] = parsedValue;
      console.log(`[DEBUG] Saved ${currentField} = ${parsedValue}`);
      console.log(`[DEBUG] Total collected: ${Object.keys(context.collectedData).join(', ')}`);
      
      // Save to FHIR as we collect data
      try {
        await saveToFHIR(context.collectedData, sessionId);
      } catch (fhirError) {
        console.log('FHIR save error (non-critical):', fhirError.message);
        // Continue even if FHIR save fails
      }
    } else {
      // Repeat the same question if input could not be parsed
      console.log(`[DEBUG] Could not parse answer, staying on question ${context.currentQuestionIndex + 1}`);
      return res.json({ 
        response: `I didn't understand that. Could you please answer: ${QUESTIONS[currentField]}`,
        message: `I didn't understand that. Could you please answer: ${QUESTIONS[currentField]}`
      });
    }

    // Move to next question or request confirmation
    context.currentQuestionIndex++;
    console.log(`[DEBUG] Moving to question index: ${context.currentQuestionIndex}/${QUESTION_FLOW.length}`);
    
    if (context.currentQuestionIndex < QUESTION_FLOW.length) {
      const nextField = QUESTION_FLOW[context.currentQuestionIndex];
      console.log(`[DEBUG] Next question: ${nextField}`);
      return res.json({ 
        response: QUESTIONS[nextField],
        message: QUESTIONS[nextField],
        collectedData: context.collectedData
      });
    } else {
      // All questions asked - trigger event to calculate risk
      console.log(`[DEBUG] All ${QUESTION_FLOW.length} questions completed!`);
      context.waitingForConfirmation = true;
      return res.json({ 
        response: "Thank you! I have all the information. Would you like me to calculate your heart disease risk now? (yes/no)",
        message: "Thank you! I have all the information. Would you like me to calculate your heart disease risk now? (yes/no)",
        collectedData: context.collectedData,
        hasEnoughData: true
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// AI-powered extraction: Use LLM to extract structured data from natural language
async function extractHealthDataWithAI(userMessage, currentField, conversationContext) {
  if (!USE_AI_EXTRACTION) {
    return null; // Fall back to rule-based parsing
  }

  try {
    const fieldDescriptions = {
      age: 'age in years (number)',
      gender: 'gender (male, female, or other)',
      systolicBP: 'systolic blood pressure in mmHg (number)',
      diastolicBP: 'diastolic blood pressure in mmHg (number)',
      cholesterol: 'total cholesterol in mg/dL (number)',
      hdlCholesterol: 'HDL cholesterol in mg/dL (number)',
      bmi: 'Body Mass Index (number, can calculate from weight/height)',
      smoking: 'smoking status (current, former, or never)',
      physicalActivity: 'physical activity level (sedentary, moderate, or active)',
      dietQuality: 'diet quality (poor, fair, good, or excellent)',
      diabetes: 'diabetes status (true/false boolean)',
      familyHistory: 'family history of heart disease (true/false boolean)'
    };

    // Special handling for BMI - AI should calculate from height/weight
    let prompt;
    if (currentField === 'bmi') {
      prompt = `You are a medical assistant calculating BMI (Body Mass Index) from patient responses.

Current question being asked: ${QUESTIONS[currentField]}

User's response: "${userMessage}"

Your task:
1. If the user provides a direct BMI number (including just a number like "22" or "25.5"), extract that number as the BMI
2. If the user provides height and weight (in any format), calculate BMI using the formula:
   - BMI = (weight in pounds / (height in inches)²) × 703
   - OR BMI = weight in kg / (height in meters)²
   
Common input formats you should handle:
- "22" or "25.5" → These are direct BMI values, extract the number
- "5 foot 3 inches, 145 pounds" → Calculate: height = 5*12 + 3 = 63 inches, BMI = (145 / 63²) × 703 = 25.7
- "5'3\", 145 lbs" → Same calculation
- "160 cm, 65 kg" → Convert: 1.6m, BMI = 65 / 1.6² = 25.4
- "BMI is 25" → Extract 25
- "I'm 5'3 and weigh 145" → Calculate BMI
- Any combination of feet/inches, cm, meters with pounds or kg

IMPORTANT: 
- If the response is just a number (like "22"), treat it as a direct BMI value
- Calculate BMI accurately when height/weight are provided. Round to 1 decimal place.
- BMI typically ranges from 15-50 for adults

Return ONLY a JSON object with this exact format:
{
  "value": <calculated_bmi_number_or_null>,
  "confidence": "high|medium|low",
  "reasoning": "brief explanation of calculation"
}

Example responses:
- User: "22" → {"value": 22, "confidence": "high", "reasoning": "Direct BMI value provided"}
- User: "5 foot 3 inches, 145 pounds" → {"value": 25.7, "confidence": "high", "reasoning": "Calculated: (145 / (63²)) × 703 = 25.7"}
- User: "My BMI is 25.5" → {"value": 25.5, "confidence": "high", "reasoning": "BMI directly provided"}
- User: "I don't know" → {"value": null, "confidence": "high", "reasoning": "User doesn't know their BMI"}

JSON response:`;
    } else {
      prompt = `You are a medical assistant extracting health information from patient responses.

Current question being asked: ${QUESTIONS[currentField]}
Field to extract: ${currentField} (${fieldDescriptions[currentField]})

User's response: "${userMessage}"

Extract the value for ${currentField} from the user's response. 
- For numbers, extract the numeric value
- For categories, match to the allowed values
- For yes/no questions, return true or false
- If the user says "I don't know" or similar, return null
- If you cannot extract a valid value, return null

Return ONLY a JSON object with this exact format:
{
  "value": <extracted_value_or_null>,
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}

Example responses:
- User: "I'm 45 years old" → {"value": 45, "confidence": "high", "reasoning": "Age explicitly stated"}
- User: "My BP is 120 over 80" → {"value": 120, "confidence": "high", "reasoning": "Systolic BP extracted"} (if currentField is systolicBP)
- User: "female" → {"value": "female", "confidence": "high", "reasoning": "Gender explicitly stated"}
- User: "male" → {"value": "male", "confidence": "high", "reasoning": "Gender explicitly stated"}
- User: "I don't smoke" → {"value": "never", "confidence": "high", "reasoning": "Negative smoking response"}
- User: "Yes, I have diabetes" → {"value": true, "confidence": "high", "reasoning": "Affirmative response"}

IMPORTANT for gender: 
- "female" should return "female" (not "male")
- "male" should return "male"
- Check for "female" before checking for "male" since "female" contains the word "male"

JSON response:`;
    }

    // Try using chat completion first (for instruction-following models)
    let result;
    try {
      const model = process.env.FALLBACK_LLM_MODEL || 'microsoft/DialoGPT-medium';
      result = await hf.chatCompletion({
        model: model,
        messages: [
          { role: 'system', content: 'You are a medical data extraction assistant. Extract health information and return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 200
      });
      
      const responseText = result.choices?.[0]?.message?.content || result.generated_text || '';
      return parseAIResponse(responseText);
    } catch (chatError) {
      // Fall back to text generation
      try {
        result = await hf.textGeneration({
          model: process.env.FALLBACK_LLM_MODEL || 'gpt2',
          inputs: prompt,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.1,
            return_full_text: false
          }
        });
        
        const responseText = result.generated_text || '';
        return parseAIResponse(responseText);
      } catch (textError) {
        console.log('AI extraction failed, falling back to rule-based parsing:', textError.message);
        return null;
      }
    }
  } catch (error) {
    console.log('AI extraction error, using fallback:', error.message);
    return null;
  }
}

// Parse AI response to extract JSON
function parseAIResponse(responseText) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.value !== undefined && parsed.value !== null) {
        return parsed.value;
      }
    }
  } catch (error) {
    console.log('Failed to parse AI response:', error.message);
  }
  return null;
}

// Fallback: Rule-based parsing (original logic)
function parseAnswer(message, field) {
  const lower = message.toLowerCase().trim();
  // Handle unknown responses
  if (['i don\'t know', 'unknown', 'skip', 'pass', 'not sure', 'unsure'].includes(lower)) return null;

  const numMatch = message.match(/\d+(\.\d+)?/);
  switch(field) {
    case 'age': return numMatch ? parseInt(numMatch[0]) : undefined;
    case 'systolicBP': 
      // Handle "120/80" format
      const bpMatch = message.match(/(\d+)\s*\/\s*(\d+)/);
      if (bpMatch) return parseInt(bpMatch[1]);
      return numMatch ? parseInt(numMatch[0]) : undefined;
    case 'diastolicBP':
      // Handle "120/80" format
      const bpMatch2 = message.match(/(\d+)\s*\/\s*(\d+)/);
      if (bpMatch2) return parseInt(bpMatch2[2]);
      return numMatch ? parseInt(numMatch[0]) : undefined;
    case 'cholesterol': return numMatch ? parseInt(numMatch[0]) : undefined;
    case 'hdlCholesterol': return numMatch ? parseInt(numMatch[0]) : undefined;
    case 'bmi': 
      // For BMI, always try AI first, but have a simple fallback for direct numbers
      // If it's just a number (likely a direct BMI value), extract it
      const simpleNumberMatch = message.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
      if (simpleNumberMatch) {
        const bmiValue = parseFloat(simpleNumberMatch[1]);
        // Validate it's a reasonable BMI (15-50)
        if (bmiValue >= 10 && bmiValue <= 60) {
          return bmiValue;
        }
      }
      // Try to match "BMI: 25" or "25 BMI" patterns
      const bmiMatch = message.match(/bmi[:\s]*(\d+(?:\.\d+)?)/i) || 
                      message.match(/(\d+(?:\.\d+)?)\s*(?:bmi|body mass index)/i);
      if (bmiMatch) {
        return parseFloat(bmiMatch[1]);
      }
      // For height/weight combinations, return undefined to let AI handle it
      // AI will calculate BMI from height/weight
      return undefined;
    case 'smoking':
      if (lower.includes('current') || lower.includes('yes') && lower.includes('smoke')) return 'current';
      if (lower.includes('former') || lower.includes('quit') || lower.includes('used to')) return 'former';
      if (lower.includes('never') || lower.includes('no') && lower.includes('smoke')) return 'never';
      break;
    case 'physicalActivity':
      if (lower.includes('sedentary') || lower.includes('little') || lower.includes('none')) return 'sedentary';
      if (lower.includes('moderate') || lower.includes('some') || lower.includes('regular')) return 'moderate';
      if (lower.includes('active') || lower.includes('exercise') || lower.includes('daily')) return 'active';
      break;
    case 'dietQuality':
      if (lower.includes('poor') || lower.includes('bad') || lower.includes('unhealthy')) return 'poor';
      if (lower.includes('fair') || lower.includes('okay') || lower.includes('average')) return 'fair';
      if (lower.includes('good') || lower.includes('healthy')) return 'good';
      if (lower.includes('excellent') || lower.includes('very good') || lower.includes('great')) return 'excellent';
      break;
    case 'diabetes': 
      if (lower.includes('yes') || lower.includes('have') || lower.includes('diagnosed')) return true;
      if (lower.includes('no') || lower.includes('don\'t') || lower.includes('do not')) return false;
      return undefined;
    case 'familyHistory': 
      if (lower.includes('yes') || lower.includes('have') || lower.includes('family')) return true;
      if (lower.includes('no') || lower.includes('don\'t') || lower.includes('do not')) return false;
      return undefined;
    case 'gender':
      // Check for female first (since "female" contains "male")
      if (lower.includes('female') || lower.includes('woman') || lower === 'f' || lower.startsWith('f ')) return 'female';
      if (lower.includes('male') || lower.includes('man') || lower === 'm' || lower.startsWith('m ')) return 'male';
      if (lower.includes('other') || lower.includes('non-binary')) return 'other';
      return undefined;
  }
  return undefined;
}

// Calculate risk endpoint (for manual calculation)
router.post('/calculate-risk', async (req, res) => {
  try {
    const { patientData } = req.body;
    
    if (!patientData || Object.keys(patientData).length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Insufficient data provided. Please provide at least 2 health factors.' 
      });
    }

    const { riskAssessment, recommendations } = await calculateRisk(patientData);
    
    res.json({
      success: true,
      riskAssessment,
      recommendations,
      collectedData: patientData
    });
  } catch (err) {
    console.error('Error calculating risk:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to calculate risk assessment.' 
    });
  }
});

// Save collected data to FHIR resources
async function saveToFHIR(collectedData, sessionId) {
  try {
    // Convert to FHIR Patient resource format
    const fhirPatient = {
      resourceType: 'Patient',
      id: `patient-${sessionId}`,
      gender: collectedData.gender || 'unknown',
      birthDate: collectedData.age ? calculateBirthDate(collectedData.age) : undefined,
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/patient-birthTime',
          valueDateTime: collectedData.age ? calculateBirthDate(collectedData.age) : undefined
        }
      ]
    };

    // Create/update patient
    try {
      await axios.post(`${FHIR_SERVER_URL}/Patient`, fhirPatient, {
        headers: { 'Content-Type': 'application/fhir+json' }
      });
    } catch (error) {
      // Try update if create fails
      if (error.response?.status === 409 || error.response?.status === 400) {
        await axios.put(`${FHIR_SERVER_URL}/Patient/patient-${sessionId}`, fhirPatient, {
          headers: { 'Content-Type': 'application/fhir+json' }
        });
      }
    }

    // Create Observations for health metrics
    const observations = [];
    
    if (collectedData.systolicBP !== undefined || collectedData.diastolicBP !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel with all children optional'
          }],
          text: 'Blood Pressure'
        },
        subject: { reference: `Patient/patient-${sessionId}` },
        component: [
          ...(collectedData.systolicBP ? [{
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }]
            },
            valueQuantity: {
              value: collectedData.systolicBP,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          }] : []),
          ...(collectedData.diastolicBP ? [{
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8462-4',
                display: 'Diastolic blood pressure'
              }]
            },
            valueQuantity: {
              value: collectedData.diastolicBP,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          }] : [])
        ]
      });
    }

    if (collectedData.cholesterol !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '2093-3',
            display: 'Cholesterol, Total'
          }],
          text: 'Total Cholesterol'
        },
        subject: { reference: `Patient/patient-${sessionId}` },
        valueQuantity: {
          value: collectedData.cholesterol,
          unit: 'mg/dL',
          system: 'http://unitsofmeasure.org',
          code: 'mg/dL'
        }
      });
    }

    if (collectedData.hdlCholesterol !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '2085-9',
            display: 'Cholesterol, HDL'
          }],
          text: 'HDL Cholesterol'
        },
        subject: { reference: `Patient/patient-${sessionId}` },
        valueQuantity: {
          value: collectedData.hdlCholesterol,
          unit: 'mg/dL',
          system: 'http://unitsofmeasure.org',
          code: 'mg/dL'
        }
      });
    }

    if (collectedData.bmi !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '39156-5',
            display: 'Body mass index (BMI) [Ratio]'
          }],
          text: 'Body Mass Index'
        },
        subject: { reference: `Patient/patient-${sessionId}` },
        valueQuantity: {
          value: collectedData.bmi,
          unit: 'kg/m2',
          system: 'http://unitsofmeasure.org',
          code: 'kg/m2'
        }
      });
    }

    // Save observations
    for (const obs of observations) {
      try {
        await axios.post(`${FHIR_SERVER_URL}/Observation`, obs, {
          headers: { 'Content-Type': 'application/fhir+json' }
        });
      } catch (obsError) {
        console.log('Observation save error (non-critical):', obsError.message);
      }
    }

    console.log(`✓ Saved health data to FHIR for session ${sessionId}`);
  } catch (error) {
    console.log('FHIR save error (non-critical, continuing):', error.message);
    // Don't throw - allow conversation to continue even if FHIR save fails
  }
}

// Helper: Calculate approximate birth date from age
function calculateBirthDate(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return `${birthYear}-01-01`; // Approximate to January 1st
}

// Helper: calculate risk using your existing riskCalculator
async function calculateRisk(collectedData) {
  const riskAssessment = await riskCalculator.calculateRisk(collectedData, false, true);
  const recommendations = riskCalculator.generateRecommendations(riskAssessment, collectedData);
  return { riskAssessment, recommendations };
}

module.exports = router;
