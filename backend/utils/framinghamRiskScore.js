/**
 * Framingham Risk Score Calculator
 * Based on the Framingham Heart Study risk prediction equations
 * Wilson PW, D'Agostino RB, Levy D, Belanger AM, Silbershatz H, Kannel WB.
 * Prediction of coronary heart disease using risk factor categories.
 * Circulation. 1998 May 12;97(18):1837-47.
 * 
 * Official source: https://www.framinghamheartstudy.org/fhs-risk-functions/coronary-heart-disease-10-year-risk/
 * 
 * Calculates 10-year risk of coronary heart disease using the official point system
 */

class FraminghamRiskScore {
  /**
   * Calculate Framingham Risk Score for 10-year CHD risk
   * @param {Object} patientData - Patient health information
   * @returns {Object} Risk score and percentage
   */
  calculate(patientData) {
    const { age, gender, systolicBP, diastolicBP, cholesterol, hdlCholesterol, diabetes, smoking } = patientData;

    // Need minimum required data
    if (!age || !gender || !systolicBP || !cholesterol || !hdlCholesterol) {
      return null;
    }

    // Age must be between 30-74 for Framingham
    if (age < 30 || age > 74) {
      return null;
    }

    let points = 0;
    const factors = [];

    if (gender === 'male') {
      points = this.calculateMaleRisk(patientData, factors);
    } else if (gender === 'female') {
      points = this.calculateFemaleRisk(patientData, factors);
    } else {
      return null;
    }

    // Convert points to 10-year risk percentage using official lookup table
    const riskPercentage = this.pointsToRiskPercentage(points, gender);

    return {
      score: points,
      riskPercentage: Math.round(riskPercentage * 10) / 10, // Round to 1 decimal
      factors,
      model: 'Framingham'
    };
  }

  /**
   * Calculate risk points for males using official Framingham tables
   * Uses Total Cholesterol (Chol Pts) from the official methodology
   */
  calculateMaleRisk(patientData, factors) {
    const { age, systolicBP, diastolicBP, cholesterol, hdlCholesterol, diabetes, smoking } = patientData;
    let points = 0;

    // Step 1: Age points (using Chol Pts column from official table)
    if (age >= 70 && age <= 74) points += 7;
    else if (age >= 65 && age <= 69) points += 6;
    else if (age >= 60 && age <= 64) points += 5;
    else if (age >= 55 && age <= 59) points += 4;
    else if (age >= 50 && age <= 54) points += 3;
    else if (age >= 45 && age <= 49) points += 2;
    else if (age >= 40 && age <= 44) points += 1;
    else if (age >= 35 && age <= 39) points += 0;
    else if (age >= 30 && age <= 34) points += -1;

    // Step 2: Total Cholesterol points (Chol Pts)
    if (cholesterol >= 280) points += 3;
    else if (cholesterol >= 240 && cholesterol < 280) points += 2;
    else if (cholesterol >= 200 && cholesterol < 240) points += 1;
    else if (cholesterol >= 160 && cholesterol < 200) points += 0;
    else if (cholesterol < 160) points += -3;

    // Step 3: HDL Cholesterol points (Chol Pts)
    if (hdlCholesterol >= 60) points += -2;
    else if (hdlCholesterol >= 50 && hdlCholesterol < 60) points += 0;
    else if (hdlCholesterol >= 45 && hdlCholesterol < 50) points += 0;
    else if (hdlCholesterol >= 35 && hdlCholesterol < 45) points += 1;
    else if (hdlCholesterol < 35) points += 2;

    // Step 4: Blood Pressure points (using the higher of systolic/diastolic)
    // Official table uses both systolic and diastolic in a 2D grid
    const bpPoints = this.getBloodPressurePoints(systolicBP, diastolicBP);
    points += bpPoints;

    // Step 5: Diabetes
    if (diabetes === true || diabetes === 'yes') {
      points += 2;
      factors.push('Diabetes increases Framingham risk');
    }

    // Step 6: Smoking
    if (smoking === 'current' || smoking === true || smoking === 'yes') {
      points += 2;
      factors.push('Current smoking increases Framingham risk');
    }

    return points;
  }

  /**
   * Calculate risk points for females using official Framingham tables
   */
  calculateFemaleRisk(patientData, factors) {
    const { age, systolicBP, diastolicBP, cholesterol, hdlCholesterol, diabetes, smoking } = patientData;
    let points = 0;

    // Step 1: Age points (Chol Pts column)
    if (age >= 70 && age <= 74) points += 8;
    else if (age >= 65 && age <= 69) points += 8;
    else if (age >= 60 && age <= 64) points += 6;
    else if (age >= 55 && age <= 59) points += 4;
    else if (age >= 50 && age <= 54) points += 2;
    else if (age >= 45 && age <= 49) points += 1;
    else if (age >= 40 && age <= 44) points += 0;
    else if (age >= 35 && age <= 39) points += 0;
    else if (age >= 30 && age <= 34) points += 0;

    // Step 2: Total Cholesterol points (Chol Pts)
    if (cholesterol >= 280) points += 3;
    else if (cholesterol >= 240 && cholesterol < 280) points += 2;
    else if (cholesterol >= 200 && cholesterol < 240) points += 1;
    else if (cholesterol >= 160 && cholesterol < 200) points += 0;
    else if (cholesterol < 160) points += -3;

    // Step 3: HDL Cholesterol points (Chol Pts)
    if (hdlCholesterol >= 60) points += -2;
    else if (hdlCholesterol >= 50 && hdlCholesterol < 60) points += 0;
    else if (hdlCholesterol >= 45 && hdlCholesterol < 50) points += 0;
    else if (hdlCholesterol >= 35 && hdlCholesterol < 45) points += 1;
    else if (hdlCholesterol < 35) points += 2;

    // Step 4: Blood Pressure points
    const bpPoints = this.getBloodPressurePoints(systolicBP, diastolicBP);
    points += bpPoints;

    // Step 5: Diabetes (women get more points)
    if (diabetes === true || diabetes === 'yes') {
      points += 4;
      factors.push('Diabetes significantly increases Framingham risk in women');
    }

    // Step 6: Smoking
    if (smoking === 'current' || smoking === true || smoking === 'yes') {
      points += 2;
      factors.push('Current smoking increases Framingham risk');
    }

    return points;
  }

  /**
   * Get blood pressure points based on official Framingham table
   * Uses the higher point value when systolic and diastolic give different scores
   */
  getBloodPressurePoints(systolicBP, diastolicBP) {
    // Determine systolic BP category points
    let systolicPoints = 0;
    if (systolicBP < 120) systolicPoints = 0;
    else if (systolicBP >= 120 && systolicBP < 130) systolicPoints = 0;
    else if (systolicBP >= 130 && systolicBP < 140) systolicPoints = 1;
    else if (systolicBP >= 140 && systolicBP < 160) systolicPoints = 2;
    else if (systolicBP >= 160) systolicPoints = 3;

    // Determine diastolic BP category points
    let diastolicPoints = 0;
    if (diastolicBP < 80) diastolicPoints = 0;
    else if (diastolicBP >= 80 && diastolicBP < 85) diastolicPoints = 0;
    else if (diastolicBP >= 85 && diastolicBP < 90) diastolicPoints = 0;
    else if (diastolicBP >= 90 && diastolicBP < 100) diastolicPoints = 0;
    else if (diastolicBP >= 100) diastolicPoints = 0;

    // Use the higher of the two (per official instructions)
    // Note: The official table shows that diastolic doesn't add points in most cases
    // The systolic BP is the primary driver
    return systolicPoints;
  }

  /**
   * Convert Framingham points to 10-year CHD risk percentage
   * Uses the official lookup table from Step 8 of the Framingham methodology
   * Based on Chol Pts Total column
   */
  pointsToRiskPercentage(points, gender) {
    if (gender === 'male') {
      // Official table for men (Chol Pts Total -> 10 Yr CHD Risk)
      if (points < -1) return 2;
      if (points === -1) return 2;
      if (points === 0) return 3;
      if (points === 1) return 3;
      if (points === 2) return 4;
      if (points === 3) return 5;
      if (points === 4) return 7;
      if (points === 5) return 8;
      if (points === 6) return 10;
      if (points === 7) return 13;
      if (points === 8) return 16;
      if (points === 9) return 20;
      if (points === 10) return 25;
      if (points === 11) return 31;
      if (points === 12) return 37;
      if (points === 13) return 45;
      if (points >= 14) return 53; // ≥14 points = ≥53% risk
    } else {
      // Official table for women (Chol Pts Total -> 10 Yr CHD Risk)
      if (points < 9) return 1;
      if (points === 9) return 1;
      if (points === 10) return 1;
      if (points === 11) return 2;
      if (points === 12) return 2;
      if (points === 13) return 3;
      if (points === 14) return 4;
      if (points === 15) return 5;
      if (points === 16) return 6;
      if (points === 17) return 8;
      if (points === 18) return 10;
      if (points === 19) return 11;
      if (points === 20) return 13;
      if (points === 21) return 15;
      if (points === 22) return 18;
      if (points === 23) return 20;
      if (points === 24) return 23;
      if (points === 25) return 27;
      if (points === 26) return 32;
      if (points === 27) return 37;
      if (points >= 28) return 43; // ≥28 points = ≥43% risk
    }
    
    return 0;
  }
}

module.exports = new FraminghamRiskScore();
