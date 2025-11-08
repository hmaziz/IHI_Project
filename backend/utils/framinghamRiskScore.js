/**
 * Framingham Risk Score Calculator
 * Based on the Framingham Heart Study risk prediction equations
 * Calculates 10-year risk of coronary heart disease
 */

class FraminghamRiskScore {
  /**
   * Calculate Framingham Risk Score for 10-year CHD risk
   * @param {Object} patientData - Patient health information
   * @returns {Object} Risk score and percentage
   */
  calculate(patientData) {
    const { age, gender, systolicBP, cholesterol, hdlCholesterol, diabetes, smoking } = patientData;

    // Need minimum required data
    if (!age || !gender || !systolicBP || !cholesterol || !hdlCholesterol) {
      return null;
    }

    let riskScore = 0;
    const factors = [];

    if (gender === 'male') {
      riskScore = this.calculateMaleRisk(patientData, factors);
    } else if (gender === 'female') {
      riskScore = this.calculateFemaleRisk(patientData, factors);
    }

    // Convert score to percentage risk
    const riskPercentage = this.scoreToPercentage(riskScore, gender, age);

    return {
      score: riskScore,
      riskPercentage: Math.round(riskPercentage * 10) / 10, // Round to 1 decimal
      factors,
      model: 'Framingham'
    };
  }

  /**
   * Calculate risk for males
   */
  calculateMaleRisk(patientData, factors) {
    const { age, systolicBP, cholesterol, hdlCholesterol, diabetes, smoking } = patientData;
    let points = 0;

    // Age points (males)
    if (age >= 70) points += 11;
    else if (age >= 65) points += 8;
    else if (age >= 60) points += 5;
    else if (age >= 55) points += 3;
    else if (age >= 50) points += 1;
    else if (age >= 45) points += 0;
    else if (age >= 40) points += 0;
    else points += 0;

    // Total Cholesterol points
    const ageGroup = age < 50 ? 'young' : age < 60 ? 'mid' : 'old';
    if (cholesterol < 160) {
      points += ageGroup === 'young' ? 0 : ageGroup === 'mid' ? 0 : 0;
    } else if (cholesterol < 200) {
      points += ageGroup === 'young' ? 1 : ageGroup === 'mid' ? 1 : 1;
    } else if (cholesterol < 240) {
      points += ageGroup === 'young' ? 2 : ageGroup === 'mid' ? 2 : 1;
    } else if (cholesterol < 280) {
      points += ageGroup === 'young' ? 3 : ageGroup === 'mid' ? 2 : 1;
    } else {
      points += ageGroup === 'young' ? 4 : ageGroup === 'mid' ? 3 : 2;
    }

    // HDL Cholesterol points
    if (hdlCholesterol >= 60) points -= 1;
    else if (hdlCholesterol >= 50) points += 0;
    else if (hdlCholesterol >= 40) points += 1;
    else points += 2;

    // Blood Pressure points
    if (systolicBP < 120) {
      points += 0;
    } else if (systolicBP < 130) {
      points += 1;
    } else if (systolicBP < 140) {
      points += 2;
    } else if (systolicBP < 160) {
      points += 3;
    } else {
      points += 4;
    }

    // Diabetes
    if (diabetes === true || diabetes === 'yes') {
      points += 2;
      factors.push('Diabetes increases Framingham risk');
    }

    // Smoking
    if (smoking === 'current' || smoking === true || smoking === 'yes') {
      points += 2;
      factors.push('Current smoking increases Framingham risk');
    }

    return points;
  }

  /**
   * Calculate risk for females
   */
  calculateFemaleRisk(patientData, factors) {
    const { age, systolicBP, cholesterol, hdlCholesterol, diabetes, smoking } = patientData;
    let points = 0;

    // Age points (females)
    if (age >= 70) points += 12;
    else if (age >= 65) points += 8;
    else if (age >= 60) points += 5;
    else if (age >= 55) points += 3;
    else if (age >= 50) points += 2;
    else if (age >= 45) points += 0;
    else if (age >= 40) points += 0;
    else points += 0;

    // Total Cholesterol points
    const ageGroup = age < 50 ? 'young' : age < 60 ? 'mid' : 'old';
    if (cholesterol < 160) {
      points += ageGroup === 'young' ? 0 : ageGroup === 'mid' ? 0 : 0;
    } else if (cholesterol < 200) {
      points += ageGroup === 'young' ? 1 : ageGroup === 'mid' ? 1 : 1;
    } else if (cholesterol < 240) {
      points += ageGroup === 'young' ? 2 : ageGroup === 'mid' ? 2 : 1;
    } else if (cholesterol < 280) {
      points += ageGroup === 'young' ? 3 : ageGroup === 'mid' ? 2 : 1;
    } else {
      points += ageGroup === 'young' ? 4 : ageGroup === 'mid' ? 3 : 2;
    }

    // HDL Cholesterol points
    if (hdlCholesterol >= 60) points -= 1;
    else if (hdlCholesterol >= 50) points += 0;
    else if (hdlCholesterol >= 40) points += 1;
    else points += 2;

    // Blood Pressure points
    if (systolicBP < 120) {
      points += 0;
    } else if (systolicBP < 130) {
      points += 1;
    } else if (systolicBP < 140) {
      points += 2;
    } else if (systolicBP < 160) {
      points += 3;
    } else {
      points += 4;
    }

    // Diabetes
    if (diabetes === true || diabetes === 'yes') {
      points += 4;
      factors.push('Diabetes significantly increases Framingham risk in women');
    }

    // Smoking
    if (smoking === 'current' || smoking === true || smoking === 'yes') {
      points += 2;
      factors.push('Current smoking increases Framingham risk');
    }

    return points;
  }

  /**
   * Convert Framingham points to 10-year risk percentage
   * Simplified lookup table based on Framingham study
   */
  scoreToPercentage(points, gender, age) {
    // Simplified risk percentage mapping
    // In practice, this would use detailed lookup tables from the Framingham study
    
    if (gender === 'male') {
      if (points <= 0) return 1;
      if (points <= 3) return 2;
      if (points <= 5) return 3;
      if (points <= 7) return 5;
      if (points <= 9) return 7;
      if (points <= 11) return 10;
      if (points <= 13) return 13;
      if (points <= 15) return 16;
      if (points <= 17) return 20;
      if (points <= 19) return 25;
      return 30;
    } else {
      // Female
      if (points <= 0) return 1;
      if (points <= 3) return 2;
      if (points <= 5) return 3;
      if (points <= 7) return 4;
      if (points <= 9) return 6;
      if (points <= 11) return 8;
      if (points <= 13) return 11;
      if (points <= 15) return 14;
      if (points <= 17) return 18;
      if (points <= 19) return 22;
      return 27;
    }
  }
}

module.exports = new FraminghamRiskScore();

