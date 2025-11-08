/**
 * Heart Disease Risk Assessment Calculator
 * Combines Framingham Risk Score and AHA PREVENT model
 * Includes database comparison with Synthea data
 */

const framinghamRiskScore = require('./framinghamRiskScore');
const preventModel = require('./preventModel');
const databaseComparison = require('./databaseComparison');

class RiskCalculator {
  /**
   * Calculate heart disease risk score using combined Framingham and PREVENT models
   * @param {Object} patientData - Patient health information
   * @param {Boolean} includeComparison - Whether to include database comparison
   * @returns {Object} Risk assessment with score, category, and justification
   */
  async calculateRisk(patientData, includeComparison = false) {
    // Calculate using both models
    const framinghamResult = framinghamRiskScore.calculate(patientData);
    const preventResult = preventModel.calculate(patientData);

    // Combine the results
    let combinedRiskScore = 0;
    let combinedRiskPercentage = 0;
    const allFactors = [];

    if (framinghamResult) {
      combinedRiskPercentage += framinghamResult.riskPercentage;
      allFactors.push(...framinghamResult.factors);
    }

    if (preventResult) {
      combinedRiskPercentage += preventResult.risk10Year;
      allFactors.push(...preventResult.factors);
    }

    // Average the two models if both are available
    if (framinghamResult && preventResult) {
      combinedRiskPercentage = (framinghamResult.riskPercentage + preventResult.risk10Year) / 2;
    } else if (framinghamResult) {
      combinedRiskPercentage = framinghamResult.riskPercentage;
    } else if (preventResult) {
      combinedRiskPercentage = preventResult.risk10Year;
    }

    // Convert percentage to a 0-100 score for display
    combinedRiskScore = Math.min(100, combinedRiskPercentage * 2);

    // Get database comparison if requested
    let databaseComparisonResult = null;
    if (includeComparison) {
      try {
        const dbStats = await databaseComparison.getDatabaseStatistics();
        databaseComparisonResult = databaseComparison.compare(patientData, dbStats);
      } catch (error) {
        console.error('Error getting database comparison:', error);
      }
    }

    // Categorize risk based on combined percentage
    let category, categoryDescription;
    if (combinedRiskPercentage >= 20) {
      category = 'high';
      categoryDescription = 'High Risk';
    } else if (combinedRiskPercentage >= 10) {
      category = 'moderate';
      categoryDescription = 'Moderate Risk';
    } else if (combinedRiskPercentage >= 5) {
      category = 'low-moderate';
      categoryDescription = 'Low-Moderate Risk';
    } else {
      category = 'low';
      categoryDescription = 'Low Risk';
    }

    return {
      riskScore: Math.round(combinedRiskScore),
      riskPercentage: Math.round(combinedRiskPercentage * 10) / 10,
      category,
      categoryDescription,
      factors: allFactors,
      models: {
        framingham: framinghamResult,
        prevent: preventResult
      },
      databaseComparison: databaseComparisonResult,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Legacy method for backward compatibility
   * @param {Object} patientData - Patient health information
   * @returns {Object} Risk assessment with score, category, and justification
   */
  calculateRiskSync(patientData) {
    const {
      age,
      gender,
      systolicBP,
      diastolicBP,
      cholesterol,
      hdlCholesterol,
      diabetes,
      smoking,
      familyHistory,
      physicalActivity,
      bmi,
      dietQuality
    } = patientData;

    let riskScore = 0;
    const factors = [];

    // Age factor (higher age = higher risk)
    if (age >= 75) {
      riskScore += 15;
      factors.push('Advanced age (75+) significantly increases risk');
    } else if (age >= 65) {
      riskScore += 10;
      factors.push('Age (65-74) increases risk');
    } else if (age >= 55) {
      riskScore += 5;
      factors.push('Age (55-64) moderately increases risk');
    } else if (age >= 45) {
      riskScore += 2;
      factors.push('Age (45-54) slightly increases risk');
    }

    // Gender factor (men typically at higher risk at younger ages)
    if (gender === 'male') {
      if (age < 55) {
        riskScore += 5;
        factors.push('Male gender under 55 increases risk');
      }
    } else if (gender === 'female') {
      if (age >= 55) {
        riskScore += 3;
        factors.push('Post-menopausal status increases risk');
      }
    }

    // Blood Pressure factors
    if (systolicBP >= 180 || diastolicBP >= 120) {
      riskScore += 20;
      factors.push('Stage 3 hypertension (very high risk)');
    } else if (systolicBP >= 140 || diastolicBP >= 90) {
      riskScore += 15;
      factors.push('Stage 2 hypertension (high risk)');
    } else if (systolicBP >= 130 || diastolicBP >= 80) {
      riskScore += 8;
      factors.push('Stage 1 hypertension (moderate risk)');
    } else if (systolicBP >= 120 || diastolicBP >= 80) {
      riskScore += 3;
      factors.push('Elevated blood pressure (slight risk)');
    }

    // Cholesterol factors
    if (cholesterol >= 240) {
      riskScore += 12;
      factors.push('High total cholesterol (≥240 mg/dL) significantly increases risk');
    } else if (cholesterol >= 200) {
      riskScore += 6;
      factors.push('Borderline high cholesterol (200-239 mg/dL) increases risk');
    }

    // HDL Cholesterol (protective factor)
    if (hdlCholesterol < 40) {
      riskScore += 8;
      factors.push('Low HDL cholesterol (<40 mg/dL) increases risk');
    } else if (hdlCholesterol >= 60) {
      riskScore -= 2; // Protective factor
      factors.push('High HDL cholesterol (≥60 mg/dL) is protective');
    }

    // Diabetes
    if (diabetes === true || diabetes === 'yes') {
      riskScore += 15;
      factors.push('Diabetes significantly increases cardiovascular risk');
    }

    // Smoking
    if (smoking === true || smoking === 'yes' || smoking === 'current') {
      riskScore += 12;
      factors.push('Smoking significantly increases heart disease risk');
    } else if (smoking === 'former') {
      riskScore += 3;
      factors.push('Previous smoking history slightly increases risk');
    }

    // Family History
    if (familyHistory === true || familyHistory === 'yes') {
      riskScore += 8;
      factors.push('Family history of heart disease increases risk');
    }

    // Physical Activity (inverse relationship)
    if (physicalActivity === 'none' || physicalActivity === 'sedentary') {
      riskScore += 10;
      factors.push('Lack of physical activity increases risk');
    } else if (physicalActivity === 'minimal') {
      riskScore += 5;
      factors.push('Minimal physical activity moderately increases risk');
    } else if (physicalActivity === 'moderate' || physicalActivity === 'active') {
      riskScore -= 3; // Protective factor
      factors.push('Regular physical activity is protective');
    }

    // BMI/Obesity
    if (bmi >= 30) {
      riskScore += 8;
      factors.push('Obesity (BMI ≥30) increases risk');
    } else if (bmi >= 25) {
      riskScore += 4;
      factors.push('Overweight (BMI 25-29.9) moderately increases risk');
    }

    // Diet Quality
    if (dietQuality === 'poor') {
      riskScore += 8;
      factors.push('Poor diet quality increases risk');
    } else if (dietQuality === 'fair') {
      riskScore += 4;
      factors.push('Fair diet quality moderately increases risk');
    } else if (dietQuality === 'good' || dietQuality === 'excellent') {
      riskScore -= 2; // Protective factor
      factors.push('Good diet quality is protective');
    }

    // Ensure score is within reasonable bounds
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Categorize risk
    let category, categoryDescription;
    if (riskScore >= 40) {
      category = 'high';
      categoryDescription = 'High Risk';
    } else if (riskScore >= 20) {
      category = 'moderate';
      categoryDescription = 'Moderate Risk';
    } else if (riskScore >= 10) {
      category = 'low-moderate';
      categoryDescription = 'Low-Moderate Risk';
    } else {
      category = 'low';
      categoryDescription = 'Low Risk';
    }

    return {
      riskScore: Math.round(riskScore),
      category,
      categoryDescription,
      factors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate recommendations based on risk factors
   * @param {Object} riskAssessment - Risk assessment result
   * @param {Object} patientData - Original patient data
   * @returns {Array} Array of recommendation objects
   */
  generateRecommendations(riskAssessment, patientData) {
    const recommendations = [];

    // Blood pressure recommendations
    if (patientData.systolicBP >= 130 || patientData.diastolicBP >= 80) {
      recommendations.push({
        category: 'Blood Pressure',
        priority: 'high',
        action: 'Manage blood pressure through lifestyle changes and/or medication',
        details: 'Aim for BP < 120/80 mmHg. Consider reducing sodium intake, increasing physical activity, and consulting with a healthcare provider about medication if needed.'
      });
    }

    // Cholesterol recommendations
    if (patientData.cholesterol >= 200 || patientData.hdlCholesterol < 40) {
      recommendations.push({
        category: 'Cholesterol',
        priority: 'high',
        action: 'Improve cholesterol levels through diet and exercise',
        details: 'Reduce saturated and trans fats, increase omega-3 fatty acids, and engage in regular physical activity. Consider medication if lifestyle changes are insufficient.'
      });
    }

    // Smoking recommendations
    if (patientData.smoking === true || patientData.smoking === 'yes' || patientData.smoking === 'current') {
      recommendations.push({
        category: 'Smoking',
        priority: 'critical',
        action: 'Quit smoking immediately',
        details: 'Smoking is one of the most significant modifiable risk factors. Seek support through smoking cessation programs, nicotine replacement therapy, or medications.'
      });
    }

    // Physical activity recommendations
    if (patientData.physicalActivity === 'none' || patientData.physicalActivity === 'sedentary') {
      recommendations.push({
        category: 'Physical Activity',
        priority: 'high',
        action: 'Start a regular exercise routine',
        details: 'Aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity per week, plus muscle-strengthening activities twice a week.'
      });
    }

    // Diet recommendations
    if (patientData.dietQuality === 'poor' || patientData.dietQuality === 'fair') {
      recommendations.push({
        category: 'Diet',
        priority: 'high',
        action: 'Adopt a heart-healthy diet',
        details: 'Follow a Mediterranean or DASH diet: increase fruits, vegetables, whole grains, lean proteins, and healthy fats. Reduce processed foods, sugar, and sodium.'
      });
    }

    // Weight management recommendations
    if (patientData.bmi >= 25) {
      recommendations.push({
        category: 'Weight Management',
        priority: 'moderate',
        action: 'Achieve and maintain a healthy weight',
        details: 'Aim for a BMI between 18.5-24.9 through a combination of diet and exercise. Even a 5-10% weight loss can significantly improve cardiovascular health.'
      });
    }

    // Diabetes management (if applicable)
    if (patientData.diabetes === true || patientData.diabetes === 'yes') {
      recommendations.push({
        category: 'Diabetes Management',
        priority: 'critical',
        action: 'Maintain optimal blood glucose control',
        details: 'Work with your healthcare team to keep HbA1c < 7%. Monitor blood sugar regularly, take medications as prescribed, and maintain a diabetes-friendly diet.'
      });
    }

    // General recommendations for high risk
    if (riskAssessment.category === 'high') {
      recommendations.push({
        category: 'Medical Care',
        priority: 'critical',
        action: 'Consult with a cardiologist or primary care physician',
        details: 'Given your risk level, regular monitoring and potentially preventive medications (like statins or aspirin) may be recommended. Schedule an appointment soon.'
      });
    }

    // Preventive care for all
    recommendations.push({
      category: 'Preventive Care',
      priority: 'moderate',
      action: 'Schedule regular health checkups',
      details: 'Get annual physical exams, monitor blood pressure and cholesterol regularly, and discuss your risk factors with your healthcare provider.'
    });

    return recommendations;
  }
}

module.exports = new RiskCalculator();

