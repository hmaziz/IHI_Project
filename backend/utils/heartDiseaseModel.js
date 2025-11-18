/**
 * Heart Disease Prediction Model Integration
 * Uses Sarah0022/heart-disease-model from Hugging Face
 */

const { HfInference } = require('@huggingface/inference');

class HeartDiseaseModel {
  constructor(apiKey) {
    this.hf = new HfInference(apiKey);
    this.modelName = 'Sarah0022/heart-disease-model';
  }

  /**
   * Prepare patient data for model input
   * Converts patient data to the format expected by the model
   */
  prepareInput(patientData) {
    // The model may expect specific features - adjust based on model requirements
    // Common features for heart disease models: age, sex, cp, trestbps, chol, etc.
    const input = {};
    
    // Age
    if (patientData.age !== undefined) {
      input.age = patientData.age;
    }
    
    // Gender (convert to sex: 0=male, 1=female, or keep as string)
    if (patientData.gender !== undefined) {
      input.sex = patientData.gender === 'male' ? 0 : 1;
      input.gender = patientData.gender;
    }
    
    // Blood Pressure
    if (patientData.systolicBP !== undefined) {
      input.trestbps = patientData.systolicBP;
      input.systolicBP = patientData.systolicBP;
    }
    
    if (patientData.diastolicBP !== undefined) {
      input.diastolicBP = patientData.diastolicBP;
    }
    
    // Cholesterol
    if (patientData.cholesterol !== undefined) {
      input.chol = patientData.cholesterol;
      input.cholesterol = patientData.cholesterol;
    }
    
    if (patientData.hdlCholesterol !== undefined) {
      input.hdl = patientData.hdlCholesterol;
      input.hdlCholesterol = patientData.hdlCholesterol;
    }
    
    // Resting ECG, Max Heart Rate, Exercise induced angina (use defaults if not provided)
    // These might not be in patient data, so we'll use reasonable defaults
    input.thalach = patientData.maxHeartRate || (220 - (patientData.age || 50)); // Estimated max HR
    input.oldpeak = 0; // ST depression - not typically collected, default to 0
    
    // Slope, CA, Thal - these are specialized cardiac test results, not typically available
    // We'll set to default values or try to infer from available data
    
    // Convert categorical variables if needed
    if (patientData.smoking) {
      input.smoking = patientData.smoking === 'current' ? 1 : (patientData.smoking === 'former' ? 0.5 : 0);
    }
    
    if (patientData.diabetes !== undefined) {
      input.fbs = patientData.diabetes ? 1 : 0; // Fasting blood sugar > 120
    }
    
    return input;
  }

  /**
   * Call the heart disease model via Hugging Face Inference API
   */
  async predict(patientData) {
    try {
      const input = this.prepareInput(patientData);
      
      // Try different inference methods based on model type
      try {
        // Try as a classification task first
        const result = await this.hf.textClassification({
          model: this.modelName,
          inputs: JSON.stringify(input)
        });
        
        return this.processClassificationResult(result, input);
      } catch (classificationError) {
        console.log('Text classification failed, trying text generation...', classificationError.message);
        
        // Try as text generation with structured prompt
        const prompt = `Based on these patient parameters: ${JSON.stringify(input)}, predict the probability of heart disease (0-1 scale).`;
        
        const result = await this.hf.textGeneration({
          model: this.modelName,
          inputs: prompt,
          parameters: {
            max_new_tokens: 50,
            return_full_text: false
          }
        });
        
        return this.processTextGenerationResult(result, input);
      }
    } catch (error) {
      console.error('Error calling heart disease model:', error);
      throw error;
    }
  }

  /**
   * Process classification result
   */
  processClassificationResult(result, input) {
    // Result format varies by model - adapt as needed
    if (Array.isArray(result) && result.length > 0) {
      const prediction = result[0];
      const probability = prediction.score || 0.5;
      const label = prediction.label || 'heart_disease';
      
      return {
        probability: probability,
        riskPercentage: probability * 100,
        label: label,
        model: 'Sarah0022/heart-disease-model',
        input: input,
        confidence: probability
      };
    }
    
    // Fallback if result structure is different
    return {
      probability: 0.5,
      riskPercentage: 50,
      label: 'unknown',
      model: 'Sarah0022/heart-disease-model',
      input: input
    };
  }

  /**
   * Process text generation result
   */
  processTextGenerationResult(result, input) {
    const text = result.generated_text || '';
    
    // Try to extract probability from text
    const probabilityMatch = text.match(/[\d.]+/);
    let probability = 0.5;
    
    if (probabilityMatch) {
      const num = parseFloat(probabilityMatch[0]);
      // If it's > 1, it might be a percentage, so divide by 100
      probability = num > 1 ? num / 100 : num;
      probability = Math.max(0, Math.min(1, probability)); // Clamp to 0-1
    }
    
    return {
      probability: probability,
      riskPercentage: probability * 100,
      label: 'heart_disease',
      model: 'Sarah0022/heart-disease-model',
      input: input,
      rawResponse: text
    };
  }

  /**
   * Get risk assessment in standard format
   */
  async getRiskAssessment(patientData) {
    try {
      const prediction = await this.predict(patientData);
      
      // Convert to standard risk assessment format
      const riskPercentage = prediction.riskPercentage || 0;
      
      let category, categoryDescription;
      if (riskPercentage >= 20) {
        category = 'high';
        categoryDescription = 'High Risk';
      } else if (riskPercentage >= 10) {
        category = 'moderate';
        categoryDescription = 'Moderate Risk';
      } else if (riskPercentage >= 5) {
        category = 'low-moderate';
        categoryDescription = 'Low-Moderate Risk';
      } else {
        category = 'low';
        categoryDescription = 'Low Risk';
      }
      
      return {
        riskScore: Math.round(riskPercentage * 2), // Convert to 0-100 scale
        riskPercentage: Math.round(riskPercentage * 10) / 10,
        category,
        categoryDescription,
        factors: [`Sarah0022 model prediction: ${riskPercentage.toFixed(1)}% risk`],
        models: {
          sarah0022: prediction
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting risk assessment from Sarah0022 model:', error);
      throw error;
    }
  }
}

module.exports = HeartDiseaseModel;

