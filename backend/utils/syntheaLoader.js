/**
 * Synthea Data Loader
 * Loads and parses Synthea-generated FHIR JSON files to extract patient statistics
 */

const fs = require('fs');
const path = require('path');

class SyntheaLoader {
  constructor() {
    this.dataCache = null;
    this.statsCache = null;
    this.dataDirectory = process.env.SYNTHEA_DATA_DIR || path.join(__dirname, '../../data/synthea');
  }

  /**
   * Load Synthea data from JSON files
   * @returns {Array} Array of parsed FHIR resources
   */
  loadSyntheaData() {
    if (this.dataCache) {
      return this.dataCache;
    }

    try {
      const dataFiles = this.findSyntheaFiles();
      const allResources = [];

      for (const file of dataFiles) {
        try {
          const fileContent = fs.readFileSync(file, 'utf8');
          const resources = JSON.parse(fileContent);
          
          // Handle both single resource and bundle formats
          if (Array.isArray(resources)) {
            allResources.push(...resources);
          } else if (resources.resourceType === 'Bundle' && resources.entry) {
            resources.entry.forEach(entry => {
              if (entry.resource) {
                allResources.push(entry.resource);
              }
            });
          } else if (resources.resourceType) {
            // Single resource
            allResources.push(resources);
          }
        } catch (error) {
          console.error(`Error parsing file ${file}:`, error.message);
        }
      }

      this.dataCache = allResources;
      console.log(`Loaded ${allResources.length} Synthea resources from ${dataFiles.length} files`);
      return allResources;
    } catch (error) {
      console.error('Error loading Synthea data:', error);
      return [];
    }
  }

  /**
   * Find all Synthea JSON files in the data directory
   */
  findSyntheaFiles() {
    const files = [];
    
    try {
      if (!fs.existsSync(this.dataDirectory)) {
        console.warn(`Synthea data directory not found: ${this.dataDirectory}`);
        return files;
      }

      const items = fs.readdirSync(this.dataDirectory, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(this.dataDirectory, item.name);
        
        if (item.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = this.findSyntheaFilesRecursive(fullPath);
          files.push(...subFiles);
        } else if (item.isFile() && item.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error('Error finding Synthea files:', error);
    }

    return files;
  }

  /**
   * Recursively find JSON files in a directory
   */
  findSyntheaFilesRecursive(dir) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          files.push(...this.findSyntheaFilesRecursive(fullPath));
        } else if (item.isFile() && item.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors in subdirectories
    }

    return files;
  }

  /**
   * Calculate statistics from Synthea data
   * @returns {Object} Statistics object with averages and medians
   */
  calculateStatistics() {
    if (this.statsCache) {
      return this.statsCache;
    }

    const resources = this.loadSyntheaData();
    
    const stats = {
      systolicBP: { values: [], average: 0, median: 0, count: 0 },
      diastolicBP: { values: [], average: 0, median: 0, count: 0 },
      cholesterol: { values: [], average: 0, median: 0, count: 0 },
      hdlCholesterol: { values: [], average: 0, median: 0, count: 0 },
      bmi: { values: [], average: 0, median: 0, count: 0 },
      age: { values: [], average: 0, median: 0, count: 0 }
    };

    // Extract Patient resources for age calculation
    const patients = resources.filter(r => r.resourceType === 'Patient');
    patients.forEach(patient => {
      if (patient.birthDate) {
        const age = this.calculateAge(patient.birthDate);
        if (age > 0 && age < 120) {
          stats.age.values.push(age);
        }
      }
    });

    // Extract Observation resources
    const observations = resources.filter(r => r.resourceType === 'Observation');
    
    observations.forEach(obs => {
      if (!obs.code || !obs.code.coding) return;

      const coding = obs.code.coding[0];
      const code = coding?.code;
      const system = coding?.system;

      // Blood Pressure (can be panel or individual components)
      if (code === '85354-9' || system === 'http://loinc.org') {
        if (obs.component) {
          obs.component.forEach(comp => {
            if (comp.code && comp.code.coding) {
              const compCode = comp.code.coding[0]?.code;
              if (compCode === '8480-6' && comp.valueQuantity) {
                // Systolic BP
                const value = comp.valueQuantity.value;
                if (value > 50 && value < 300) {
                  stats.systolicBP.values.push(value);
                }
              } else if (compCode === '8462-4' && comp.valueQuantity) {
                // Diastolic BP
                const value = comp.valueQuantity.value;
                if (value > 30 && value < 200) {
                  stats.diastolicBP.values.push(value);
                }
              }
            }
          });
        }
      }

      // Total Cholesterol
      if (code === '2093-3' || (system === 'http://loinc.org' && code === '2093-3')) {
        if (obs.valueQuantity && obs.valueQuantity.value) {
          const value = obs.valueQuantity.value;
          if (value > 50 && value < 500) {
            stats.cholesterol.values.push(value);
          }
        }
      }

      // HDL Cholesterol
      if (code === '2085-9' || (system === 'http://loinc.org' && code === '2085-9')) {
        if (obs.valueQuantity && obs.valueQuantity.value) {
          const value = obs.valueQuantity.value;
          if (value > 10 && value < 150) {
            stats.hdlCholesterol.values.push(value);
          }
        }
      }

      // BMI
      if (code === '39156-5' || (system === 'http://loinc.org' && code === '39156-5')) {
        if (obs.valueQuantity && obs.valueQuantity.value) {
          const value = obs.valueQuantity.value;
          if (value > 10 && value < 60) {
            stats.bmi.values.push(value);
          }
        }
      }
    });

    // Calculate averages and medians for each metric
    Object.keys(stats).forEach(key => {
      const values = stats[key].values;
      if (values.length > 0) {
        stats[key].count = values.length;
        stats[key].average = this.calculateAverage(values);
        stats[key].median = this.calculateMedian(values);
      } else {
        // Use default values if no data found
        const defaults = {
          systolicBP: 120,
          diastolicBP: 80,
          cholesterol: 200,
          hdlCholesterol: 50,
          bmi: 26.5,
          age: 50
        };
        stats[key].average = defaults[key] || 0;
        stats[key].median = defaults[key] || 0;
        stats[key].count = 0;
      }
    });

    this.statsCache = stats;
    console.log('Calculated Synthea statistics:', {
      patients: patients.length,
      observations: observations.length,
      stats: Object.keys(stats).map(k => `${k}: ${stats[k].count} samples`)
    });

    return stats;
  }

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate) {
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 0;
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
      ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
      : Math.round(sorted[mid] * 10) / 10;
  }

  /**
   * Clear cache (useful for reloading data)
   */
  clearCache() {
    this.dataCache = null;
    this.statsCache = null;
  }
}

module.exports = new SyntheaLoader();

