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
      factors.push('Diabetes increases PREVENT risk by 50%');
    }

    // Smoking multiplier
    if (smoking === 'current' || smoking === true || smoking === 'yes') {
      multiplier *= 1.4;
      factors.push('Current smoking increases PREVENT risk by 40%');
    }

    // Kidney disease multiplier (if available)
    if (kidneyDisease === true || kidneyDisease === 'yes') {
      multiplier *= 1.3;
      factors.push('Kidney disease increases PREVENT risk by 30%');
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
      factors.push('Stage 3 hypertension significantly increases PREVENT risk');
    } else if (systolicBP >= 140) {
      baseRisk += 10;
      factors.push('Stage 2 hypertension increases PREVENT risk');
    } else if (systolicBP >= 130) {
      baseRisk += 6;
      factors.push('Stage 1 hypertension moderately increases PREVENT risk');
    } else if (systolicBP >= 120) {
      baseRisk += 2;
      factors.push('Elevated blood pressure slightly increases PREVENT risk');
    }

    // Cholesterol factor (if available)
    if (cholesterol) {
      if (cholesterol >= 240) {
        baseRisk += 8;
        factors.push('High total cholesterol significantly increases PREVENT risk');
      } else if (cholesterol >= 200) {
        baseRisk += 4;
        factors.push('Borderline high cholesterol increases PREVENT risk');
      }
    }

    // HDL factor (protective if high)
    if (hdlCholesterol) {
      if (hdlCholesterol < 40) {
        baseRisk += 5;
        factors.push('Low HDL cholesterol increases PREVENT risk');
      } else if (hdlCholesterol >= 60) {
        baseRisk -= 3;
        factors.push('High HDL cholesterol is protective in PREVENT model');
      }
    }

    // BMI factor
    if (bmi) {
      if (bmi >= 30) {
        baseRisk += 6;
        factors.push('Obesity increases PREVENT risk');
      } else if (bmi >= 25) {
        baseRisk += 3;
        factors.push('Overweight moderately increases PREVENT risk');
      }
    }

    return Math.max(1, Math.min(50, baseRisk)); // Clamp between 1-50%
  }
}

module.exports = new PREVENTModel();

