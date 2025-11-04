const express = require('express');
const router = express.Router();
const axios = require('axios');

const FHIR_SERVER_URL = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';

/**
 * GET /api/fhir/patient/:id
 * Retrieve patient data from FHIR server
 */
router.get('/patient/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${FHIR_SERVER_URL}/Patient/${id}`);

    res.json({
      success: true,
      patient: response.data
    });
  } catch (error) {
    console.error('Error fetching patient from FHIR:', error);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Failed to fetch patient from FHIR server',
        message: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Failed to connect to FHIR server',
        message: error.message
      });
    }
  }
});

/**
 * POST /api/fhir/patient
 * Create or update patient data in FHIR server
 */
router.post('/patient', async (req, res) => {
  try {
    const patientData = req.body;

    // Convert our internal format to FHIR Patient resource
    const fhirPatient = convertToFHIRPatient(patientData);

    const response = await axios.post(`${FHIR_SERVER_URL}/Patient`, fhirPatient, {
      headers: {
        'Content-Type': 'application/fhir+json'
      }
    });

    res.json({
      success: true,
      patient: response.data
    });
  } catch (error) {
    console.error('Error creating patient in FHIR:', error);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Failed to create patient in FHIR server',
        message: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Failed to connect to FHIR server',
        message: error.message
      });
    }
  }
});

/**
 * POST /api/fhir/observation
 * Create observation (e.g., blood pressure, cholesterol) in FHIR server
 */
router.post('/observation', async (req, res) => {
  try {
    const observationData = req.body;

    const fhirObservation = convertToFHIRObservation(observationData);

    const response = await axios.post(`${FHIR_SERVER_URL}/Observation`, fhirObservation, {
      headers: {
        'Content-Type': 'application/fhir+json'
      }
    });

    res.json({
      success: true,
      observation: response.data
    });
  } catch (error) {
    console.error('Error creating observation in FHIR:', error);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Failed to create observation in FHIR server',
        message: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Failed to connect to FHIR server',
        message: error.message
      });
    }
  }
});

/**
 * GET /api/fhir/patient/:id/observations
 * Get all observations for a patient
 */
router.get('/patient/:id/observations', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${FHIR_SERVER_URL}/Observation?subject=Patient/${id}`);

    res.json({
      success: true,
      observations: response.data
    });
  } catch (error) {
    console.error('Error fetching observations from FHIR:', error);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Failed to fetch observations from FHIR server',
        message: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Failed to connect to FHIR server',
        message: error.message
      });
    }
  }
});

/**
 * Convert internal patient data format to FHIR Patient resource
 */
function convertToFHIRPatient(patientData) {
  return {
    resourceType: 'Patient',
    id: patientData.id || `patient-${Date.now()}`,
    gender: patientData.gender === 'male' ? 'male' : patientData.gender === 'female' ? 'female' : 'unknown',
    birthDate: patientData.birthDate || calculateBirthDate(patientData.age),
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-bmi',
        valueDecimal: patientData.bmi
      }
    ],
    identifier: [
      {
        system: 'http://hospital.example.org',
        value: patientData.id || `patient-${Date.now()}`
      }
    ]
  };
}

/**
 * Convert observation data to FHIR Observation resource
 */
function convertToFHIRObservation(observationData) {
  const { patientId, type, value, unit, code } = observationData;

  const observationMap = {
    'blood-pressure': {
      code: { code: '85354-9', display: 'Blood pressure panel' },
      component: [
        {
          code: { code: '8480-6', display: 'Systolic blood pressure' },
          valueQuantity: { value: observationData.systolicBP, unit: 'mmHg' }
        },
        {
          code: { code: '8462-4', display: 'Diastolic blood pressure' },
          valueQuantity: { value: observationData.diastolicBP, unit: 'mmHg' }
        }
      ]
    },
    'cholesterol': {
      code: { code: '2093-3', display: 'Cholesterol total' },
      valueQuantity: { value: value, unit: unit || 'mg/dL' }
    },
    'hdl-cholesterol': {
      code: { code: '2085-9', display: 'HDL Cholesterol' },
      valueQuantity: { value: value, unit: unit || 'mg/dL' }
    }
  };

  const observation = observationMap[type] || {
    code: { code: code || 'unknown', display: type },
    valueQuantity: { value: value, unit: unit || '' }
  };

  return {
    resourceType: 'Observation',
    status: 'final',
    subject: {
      reference: `Patient/${patientId}`
    },
    effectiveDateTime: new Date().toISOString(),
    ...observation
  };
}

/**
 * Calculate birth date from age
 */
function calculateBirthDate(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return `${birthYear}-01-01`; // Approximate, using January 1st
}

module.exports = router;

