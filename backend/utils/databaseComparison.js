/**
 * Database Comparison Utility
 * Compares patient data with Synthea database averages and provides insights
 */

const axios = require('axios');
const syntheaLoader = require('./syntheaLoader');

const FHIR_SERVER_URL = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';

class DatabaseComparison {
  /**
   * Get statistics from Synthea database
   * First tries to load from Synthea JSON files, then falls back to FHIR server
   * @returns {Object} Average statistics from the database
   */
  async getDatabaseStatistics() {
    try {
      // First, try to load from Synthea JSON files
      const syntheaStats = syntheaLoader.calculateStatistics();
      
      // Check if we have actual data (not just defaults)
      const hasRealData = Object.keys(syntheaStats).some(key => 
        syntheaStats[key].count > 0
      );

      if (hasRealData) {
        console.log('Using Synthea file-based statistics');
        return this.formatStatistics(syntheaStats);
      }

      // Fallback to FHIR server query (with timeout protection)
      console.log('Synthea files not found, querying FHIR server...');
      try {
        const observations = await Promise.race([
          this.queryFHIRObservations(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('FHIR query timeout')), 5000)
          )
        ]);
        const fhirStats = this.calculateStatistics(observations);
        
        // Check if FHIR has data
        const hasFhirData = Object.keys(fhirStats).some(key => 
          fhirStats[key].count > 0
        );

        if (hasFhirData) {
          return fhirStats;
        }
      } catch (fhirError) {
        console.warn('FHIR server query failed or timed out:', fhirError.message);
      }

      // Final fallback to defaults
      console.warn('No Synthea data found, using default statistics');
      return this.getDefaultStatistics();
    } catch (error) {
      console.error('Error fetching database statistics:', error.message);
      // Return default/fallback statistics if database is unavailable
      return this.getDefaultStatistics();
    }
  }

  /**
   * Format Synthea statistics to match expected format
   */
  formatStatistics(syntheaStats) {
    return {
      systolicBP: {
        average: syntheaStats.systolicBP.average,
        median: syntheaStats.systolicBP.median,
        count: syntheaStats.systolicBP.count,
        source: 'synthea'
      },
      diastolicBP: {
        average: syntheaStats.diastolicBP.average,
        median: syntheaStats.diastolicBP.median,
        count: syntheaStats.diastolicBP.count,
        source: 'synthea'
      },
      cholesterol: {
        average: syntheaStats.cholesterol.average,
        median: syntheaStats.cholesterol.median,
        count: syntheaStats.cholesterol.count,
        source: 'synthea'
      },
      hdlCholesterol: {
        average: syntheaStats.hdlCholesterol.average,
        median: syntheaStats.hdlCholesterol.median,
        count: syntheaStats.hdlCholesterol.count,
        source: 'synthea'
      },
      bmi: {
        average: syntheaStats.bmi.average,
        median: syntheaStats.bmi.median,
        count: syntheaStats.bmi.count,
        source: 'synthea'
      },
      age: {
        average: syntheaStats.age.average,
        median: syntheaStats.age.median,
        count: syntheaStats.age.count,
        source: 'synthea'
      }
    };
  }

  /**
   * Query FHIR server for observations to calculate statistics
   */
  async queryFHIRObservations() {
    try {
      // Set a short timeout to avoid hanging if FHIR server is not available
      const axiosConfig = {
        timeout: 3000, // 3 second timeout
        params: {
          _count: 1000
        }
      };

      // Query for blood pressure observations
      const bpResponse = await axios.get(`${FHIR_SERVER_URL}/Observation`, {
        ...axiosConfig,
        params: {
          ...axiosConfig.params,
          code: '85354-9' // Blood pressure panel
        }
      }).catch(() => ({ data: { entry: [] } }));

      // Query for cholesterol observations
      const cholResponse = await axios.get(`${FHIR_SERVER_URL}/Observation`, {
        ...axiosConfig,
        params: {
          ...axiosConfig.params,
          code: '2093-3' // Total cholesterol
        }
      }).catch(() => ({ data: { entry: [] } }));

      // Query for HDL observations
      const hdlResponse = await axios.get(`${FHIR_SERVER_URL}/Observation`, {
        ...axiosConfig,
        params: {
          ...axiosConfig.params,
          code: '2085-9' // HDL cholesterol
        }
      }).catch(() => ({ data: { entry: [] } }));

      // Query for BMI observations
      const bmiResponse = await axios.get(`${FHIR_SERVER_URL}/Observation`, {
        ...axiosConfig,
        params: {
          ...axiosConfig.params,
          code: '39156-5' // BMI
        }
      }).catch(() => ({ data: { entry: [] } }));

      return {
        bloodPressure: bpResponse.data?.entry || [],
        cholesterol: cholResponse.data?.entry || [],
        hdl: hdlResponse.data?.entry || [],
        bmi: bmiResponse.data?.entry || []
      };
    } catch (error) {
      console.error('Error querying FHIR for observations:', error.message);
      return {
        bloodPressure: [],
        cholesterol: [],
        hdl: [],
        bmi: []
      };
    }
  }

  /**
   * Calculate statistics from observations
   */
  calculateStatistics(observations) {
    const stats = {
      systolicBP: { average: 120, median: 120, count: 0 },
      diastolicBP: { average: 80, median: 80, count: 0 },
      cholesterol: { average: 200, median: 200, count: 0 },
      hdlCholesterol: { average: 50, median: 50, count: 0 },
      bmi: { average: 26, median: 26, count: 0 },
      age: { average: 50, median: 50, count: 0 }
    };

    // Extract and calculate from blood pressure observations
    const systolicValues = [];
    const diastolicValues = [];
    
    observations.bloodPressure.forEach(entry => {
      if (entry.resource && entry.resource.component) {
        entry.resource.component.forEach(comp => {
          if (comp.code && comp.code.coding) {
            const code = comp.code.coding[0]?.code;
            if (code === '8480-6' && comp.valueQuantity) {
              systolicValues.push(comp.valueQuantity.value);
            } else if (code === '8462-4' && comp.valueQuantity) {
              diastolicValues.push(comp.valueQuantity.value);
            }
          }
        });
      }
    });

    if (systolicValues.length > 0) {
      stats.systolicBP = {
        average: this.calculateAverage(systolicValues),
        median: this.calculateMedian(systolicValues),
        count: systolicValues.length
      };
    }

    if (diastolicValues.length > 0) {
      stats.diastolicBP = {
        average: this.calculateAverage(diastolicValues),
        median: this.calculateMedian(diastolicValues),
        count: diastolicValues.length
      };
    }

    // Extract cholesterol values
    const cholValues = observations.cholesterol
      .map(entry => entry.resource?.valueQuantity?.value)
      .filter(val => val !== undefined);

    if (cholValues.length > 0) {
      stats.cholesterol = {
        average: this.calculateAverage(cholValues),
        median: this.calculateMedian(cholValues),
        count: cholValues.length
      };
    }

    // Extract HDL values
    const hdlValues = observations.hdl
      .map(entry => entry.resource?.valueQuantity?.value)
      .filter(val => val !== undefined);

    if (hdlValues.length > 0) {
      stats.hdlCholesterol = {
        average: this.calculateAverage(hdlValues),
        median: this.calculateMedian(hdlValues),
        count: hdlValues.length
      };
    }

    // Extract BMI values
    const bmiValues = observations.bmi
      .map(entry => entry.resource?.valueQuantity?.value)
      .filter(val => val !== undefined);

    if (bmiValues.length > 0) {
      stats.bmi = {
        average: this.calculateAverage(bmiValues),
        median: this.calculateMedian(bmiValues),
        count: bmiValues.length
      };
    }

    return stats;
  }

  /**
   * Get default statistics (fallback when database unavailable)
   * Based on general population averages
   */
  getDefaultStatistics() {
    return {
      systolicBP: { average: 120, median: 120, count: 0, source: 'default' },
      diastolicBP: { average: 80, median: 80, count: 0, source: 'default' },
      cholesterol: { average: 200, median: 200, count: 0, source: 'default' },
      hdlCholesterol: { average: 50, median: 50, count: 0, source: 'default' },
      bmi: { average: 26.5, median: 26.5, count: 0, source: 'default' },
      age: { average: 50, median: 50, count: 0, source: 'default' }
    };
  }

  /**
   * Compare patient data with database statistics
   * @param {Object} patientData - Patient health information
   * @param {Object} dbStats - Database statistics
   * @returns {Object} Comparison insights
   */
  compare(patientData, dbStats) {
    const insights = [];
    const comparisons = {};

    // Compare Blood Pressure
    if (patientData.systolicBP && dbStats.systolicBP) {
      const diff = patientData.systolicBP - dbStats.systolicBP.average;
      const percentDiff = (diff / dbStats.systolicBP.average) * 100;
      
      comparisons.systolicBP = {
        patient: patientData.systolicBP,
        average: dbStats.systolicBP.average,
        difference: Math.round(diff * 10) / 10,
        percentDifference: Math.round(percentDiff * 10) / 10,
        status: this.getComparisonStatus(percentDiff, 'higher')
      };

      // Always show comparison, not just when difference is significant
      insights.push({
        metric: 'Systolic Blood Pressure',
        patient: `${patientData.systolicBP} mmHg`,
        average: `${dbStats.systolicBP.average} mmHg`,
        insight: Math.abs(percentDiff) < 5
          ? `Your systolic BP is similar to the database average (${Math.abs(percentDiff).toFixed(1)}% difference)`
          : percentDiff > 0 
            ? `Your systolic BP is ${Math.abs(percentDiff).toFixed(1)}% higher than the database average`
            : `Your systolic BP is ${Math.abs(percentDiff).toFixed(1)}% lower than the database average`,
        recommendation: percentDiff > 10 
          ? 'Consider lifestyle changes or medication to lower your blood pressure'
          : percentDiff < -5
          ? 'Your blood pressure is well-controlled compared to the average'
          : 'Your blood pressure is within normal range compared to the database average'
      });
    }

    // Compare Diastolic Blood Pressure
    if (patientData.diastolicBP && dbStats.diastolicBP) {
      const diff = patientData.diastolicBP - dbStats.diastolicBP.average;
      const percentDiff = (diff / dbStats.diastolicBP.average) * 100;
      
      comparisons.diastolicBP = {
        patient: patientData.diastolicBP,
        average: dbStats.diastolicBP.average,
        difference: Math.round(diff * 10) / 10,
        percentDifference: Math.round(percentDiff * 10) / 10,
        status: this.getComparisonStatus(percentDiff, 'higher')
      };
    }

    // Compare Total Cholesterol
    if (patientData.cholesterol && dbStats.cholesterol) {
      const diff = patientData.cholesterol - dbStats.cholesterol.average;
      const percentDiff = (diff / dbStats.cholesterol.average) * 100;
      
      comparisons.cholesterol = {
        patient: patientData.cholesterol,
        average: dbStats.cholesterol.average,
        difference: Math.round(diff * 10) / 10,
        percentDifference: Math.round(percentDiff * 10) / 10,
        status: this.getComparisonStatus(percentDiff, 'higher')
      };

      // Always show comparison
      insights.push({
        metric: 'Total Cholesterol',
        patient: `${patientData.cholesterol} mg/dL`,
        average: `${dbStats.cholesterol.average} mg/dL`,
        insight: Math.abs(percentDiff) < 5
          ? `Your cholesterol is similar to the database average (${Math.abs(percentDiff).toFixed(1)}% difference)`
          : percentDiff > 0 
            ? `Your cholesterol is ${Math.abs(percentDiff).toFixed(1)}% higher than the database average`
            : `Your cholesterol is ${Math.abs(percentDiff).toFixed(1)}% lower than the database average`,
        recommendation: percentDiff > 10 
          ? 'Consider dietary changes and exercise to improve cholesterol levels'
          : percentDiff < -5
          ? 'Your cholesterol levels are favorable compared to the average'
          : 'Your cholesterol is within normal range compared to the database average'
      });
    }

    // Compare HDL Cholesterol
    if (patientData.hdlCholesterol && dbStats.hdlCholesterol) {
      const diff = patientData.hdlCholesterol - dbStats.hdlCholesterol.average;
      const percentDiff = (diff / dbStats.hdlCholesterol.average) * 100;
      
      comparisons.hdlCholesterol = {
        patient: patientData.hdlCholesterol,
        average: dbStats.hdlCholesterol.average,
        difference: Math.round(diff * 10) / 10,
        percentDifference: Math.round(percentDiff * 10) / 10,
        status: this.getComparisonStatus(percentDiff, 'lower', true) // Higher HDL is better
      };

      // Always show comparison (HDL - higher is better)
      insights.push({
        metric: 'HDL Cholesterol',
        patient: `${patientData.hdlCholesterol} mg/dL`,
        average: `${dbStats.hdlCholesterol.average} mg/dL`,
        insight: Math.abs(percentDiff) < 5
          ? `Your HDL is similar to the database average (${Math.abs(percentDiff).toFixed(1)}% difference)`
          : percentDiff > 0 
            ? `Your HDL is ${Math.abs(percentDiff).toFixed(1)}% higher than average (good!)`
            : `Your HDL is ${Math.abs(percentDiff).toFixed(1)}% lower than average`,
        recommendation: percentDiff < -15 
          ? 'Increase physical activity and consider omega-3 supplements to raise HDL'
          : percentDiff > 10
          ? 'Your HDL levels are excellent compared to the average'
          : 'Your HDL is within normal range compared to the database average'
      });
    }

    // Compare BMI
    if (patientData.bmi && dbStats.bmi) {
      const diff = patientData.bmi - dbStats.bmi.average;
      const percentDiff = (diff / dbStats.bmi.average) * 100;
      
      comparisons.bmi = {
        patient: patientData.bmi,
        average: dbStats.bmi.average,
        difference: Math.round(diff * 10) / 10,
        percentDifference: Math.round(percentDiff * 10) / 10,
        status: this.getComparisonStatus(percentDiff, 'higher')
      };

      // Always show comparison
      insights.push({
        metric: 'Body Mass Index',
        patient: `${patientData.bmi}`,
        average: `${dbStats.bmi.average}`,
        insight: Math.abs(percentDiff) < 5
          ? `Your BMI is similar to the database average (${Math.abs(percentDiff).toFixed(1)}% difference)`
          : percentDiff > 0 
            ? `Your BMI is ${Math.abs(percentDiff).toFixed(1)}% higher than the database average`
            : `Your BMI is ${Math.abs(percentDiff).toFixed(1)}% lower than the database average`,
        recommendation: percentDiff > 10 
          ? 'Consider weight management strategies to reduce cardiovascular risk'
          : percentDiff < -5
          ? 'Your BMI is in a healthy range compared to the average'
          : 'Your BMI is within normal range compared to the database average'
      });
    }

    return {
      comparisons,
      insights,
      databaseSampleSize: dbStats.systolicBP?.count || 0
    };
  }

  /**
   * Get comparison status (better, worse, similar)
   */
  getComparisonStatus(percentDiff, direction, inverse = false) {
    const threshold = 10; // 10% difference threshold
    
    if (inverse) {
      // For metrics where higher is better (like HDL)
      if (percentDiff > threshold) return 'better';
      if (percentDiff < -threshold) return 'worse';
      return 'similar';
    } else {
      // For metrics where lower is better (like BP, cholesterol, BMI)
      if (percentDiff < -threshold) return 'better';
      if (percentDiff > threshold) return 'worse';
      return 'similar';
    }
  }

  /**
   * Calculate average
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

module.exports = new DatabaseComparison();

