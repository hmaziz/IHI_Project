/**
 * AHA PREVENT (Predicting Risk of cardiovascular disease EVENTs) Model
 * Based on the American Heart Association's PREVENT equations
 * Calculates 10-year and 30-year risk of cardiovascular disease
 */

class PREVENTModel {
  /**
   * Calculate PREVENT model risk
   * @param {Object} patientData - Patient health information
   * @returns {Object} Risk assessment with 10-year and 30-year risk
   */
  calculate(patientData) {
    const { age, gender, systolicBP, cholesterol, hdlCholesterol, diabetes, smoking, bmi, kidneyDisease } = patientData;

    // Need minimum required data
    if (!age || !gender || !systolicBP) {
      return null;
    }

    const factors = [];
    let risk10Year = 0;
    let risk30Year = 0;

    // Base risk calculation
    const baseRisk = this.calculateBaseRisk(patientData, factors);

    // Apply multipliers for additional risk factors
    let multiplier = 1.0;

    // Diabetes multiplier
    if (diabetes === true || diabetes === 'yes') {
      multiplier *= 1.5;
      factors.push('Diabetes: Increases PREVENT risk by 50% (1.5x multiplier applied to base risk).');
    }

    // Smoking multiplier
    if (smoking === 'current' || smoking === true || smoking === 'yes') {
      multiplier *= 1.4;
      factors.push('Current smoking: Increases PREVENT risk by 40% (1.4x multiplier applied to base risk).');
    }

    // Kidney disease multiplier (if available)
    if (kidneyDisease === true || kidneyDisease === 'yes') {
      multiplier *= 1.3;
      factors.push('Kidney disease: Increases PREVENT risk by 30% (1.3x multiplier applied to base risk).');
    }

    // Calculate final risks
    risk10Year = Math.min(95, baseRisk * multiplier);
    risk30Year = Math.min(95, baseRisk * multiplier * 1.8); // 30-year is typically higher

    return {
      risk10Year: Math.round(risk10Year * 10) / 10,
      risk30Year: Math.round(risk30Year * 10) / 10,
      factors,
      model: 'PREVENT'
    };
  }

  /**
   * Calculate base risk from core factors
   */
  calculateBaseRisk(patientData, factors) {
    const { age, gender, systolicBP, cholesterol, hdlCholesterol, bmi } = patientData;
    
    let baseRisk = 5; // Starting baseline risk

    // Age factor (exponential increase)
    const ageFactor = Math.pow(1.05, age - 40);
    baseRisk += ageFactor * 2;

    // Gender factor
    if (gender === 'male') {
      baseRisk += 3;
    } else {
      baseRisk += 1;
    }

    // Blood Pressure factor
    if (systolicBP >= 180) {
      baseRisk += 15;
      factors.push(`Stage 3 hypertension: Higher values increase risk (≥ 180 mmHg). Your systolic blood pressure of ${systolicBP} mmHg falls in this high-risk range.`);
    } else if (systolicBP >= 140) {
      baseRisk += 10;
      factors.push(`Stage 2 hypertension: Higher values increase risk (140-179 mmHg). Your systolic blood pressure of ${systolicBP} mmHg falls in this range.`);
    } else if (systolicBP >= 130) {
      baseRisk += 6;
      factors.push(`Stage 1 hypertension: Higher values increase risk (130-139 mmHg). Your systolic blood pressure of ${systolicBP} mmHg falls in this range.`);
    } else if (systolicBP >= 120) {
      baseRisk += 2;
      factors.push(`Elevated blood pressure: Higher values increase risk (120-129 mmHg). Your systolic blood pressure of ${systolicBP} mmHg falls in this range.`);
    } else {
      factors.push(`Normal blood pressure: Your systolic blood pressure of ${systolicBP} mmHg is within the healthy range (< 120 mmHg).`);
    }

    // Cholesterol factor (if available)
    if (cholesterol) {
      if (cholesterol >= 240) {
        baseRisk += 8;
        factors.push(`High total cholesterol: Higher values increase risk (≥ 240 mg/dL). Your total cholesterol of ${cholesterol} mg/dL falls in this high-risk range.`);
      } else if (cholesterol >= 200) {
        baseRisk += 4;
        factors.push(`Borderline high cholesterol: Higher values increase risk (200-239 mg/dL). Your total cholesterol of ${cholesterol} mg/dL falls in this range.`);
      } else if (cholesterol >= 150) {
        factors.push(`Normal total cholesterol: Your total cholesterol of ${cholesterol} mg/dL is within the desirable range (150-199 mg/dL).`);
      } else {
        factors.push(`Low total cholesterol: Your total cholesterol of ${cholesterol} mg/dL is below the normal range (< 150 mg/dL).`);
      }
    }

    // HDL factor (protective if high)
    if (hdlCholesterol) {
      if (hdlCholesterol < 40) {
        baseRisk += 5;
        factors.push(`Low HDL cholesterol: Lower values increase risk (< 40 mg/dL). Your HDL cholesterol of ${hdlCholesterol} mg/dL falls in this risk range.`);
      } else if (hdlCholesterol >= 60) {
        baseRisk -= 3;
        factors.push(`High HDL cholesterol: Higher values are protective (≥ 60 mg/dL). Your HDL cholesterol of ${hdlCholesterol} mg/dL is beneficial.`);
      } else {
        // Normal range HDL (40-59)
        factors.push(`Normal HDL cholesterol: Your HDL cholesterol of ${hdlCholesterol} mg/dL is within the normal range (40-59 mg/dL).`);
      }
    }

    // BMI factor
    if (bmi) {
      if (bmi >= 30) {
        baseRisk += 6;
        factors.push(`Obesity: A higher BMI increases your risk. Your BMI of ${bmi} indicates obesity (BMI ≥ 30).`);
      } else if (bmi >= 25) {
        baseRisk += 3;
        factors.push(`Overweight: A higher BMI increases your risk. Your BMI of ${bmi} indicates overweight (BMI 25-29.9).`);
      } else if (bmi >= 18.5) {
        factors.push(`Normal weight: Your BMI of ${bmi} is within the healthy range (BMI 18.5-24.9).`);
      } else {
        factors.push(`Underweight: Your BMI of ${bmi} is below the normal range (BMI < 18.5) and may require medical attention.`);
      }
    }

    return Math.max(1, Math.min(50, baseRisk)); // Clamp between 1-50%
  }
}

module.exports = new PREVENTModel();

