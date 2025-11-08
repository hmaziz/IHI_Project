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
 * POST /api/fhir/questionnaire
 * Store questionnaire data as FHIR resources (Patient, Observations, QuestionnaireResponse, Conditions)
 */
router.post('/questionnaire', async (req, res) => {
  try {
    const questionnaireData = req.body;
    const results = {
      patient: null,
      observations: [],
      questionnaireResponse: null,
      conditions: []
    };

    // Generate a unique patient ID
    const patientId = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. Create Patient resource
    const fhirPatient = convertToFHIRPatient({
      ...questionnaireData,
      id: patientId
    });

    try {
      const patientResponse = await axios.post(`${FHIR_SERVER_URL}/Patient`, fhirPatient, {
        headers: {
          'Content-Type': 'application/fhir+json'
        }
      });
      results.patient = patientResponse.data;
      // Extract the actual patient ID from the response (FHIR server may assign its own ID)
      const actualPatientId = patientResponse.data.id || patientId;
      results.patientId = actualPatientId;

      // 2. Create Observation resources for measurements
      const observations = [];

      // Blood Pressure Observation
      if (questionnaireData.systolicBP || questionnaireData.diastolicBP) {
        const bpObservation = convertToFHIRObservation({
          patientId: actualPatientId,
          type: 'blood-pressure',
          systolicBP: questionnaireData.systolicBP,
          diastolicBP: questionnaireData.diastolicBP
        });
        observations.push(bpObservation);
      }

      // Total Cholesterol Observation
      if (questionnaireData.cholesterol) {
        const cholesterolObs = convertToFHIRObservation({
          patientId: actualPatientId,
          type: 'cholesterol',
          value: questionnaireData.cholesterol,
          unit: 'mg/dL'
        });
        observations.push(cholesterolObs);
      }

      // HDL Cholesterol Observation
      if (questionnaireData.hdlCholesterol) {
        const hdlObs = convertToFHIRObservation({
          patientId: actualPatientId,
          type: 'hdl-cholesterol',
          value: questionnaireData.hdlCholesterol,
          unit: 'mg/dL'
        });
        observations.push(hdlObs);
      }

      // BMI Observation
      if (questionnaireData.bmi) {
        const bmiObs = {
          resourceType: 'Observation',
          status: 'final',
          subject: {
            reference: `Patient/${actualPatientId}`
          },
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '39156-5',
              display: 'Body mass index (BMI) [Ratio]'
            }],
            text: 'Body Mass Index'
          },
          valueQuantity: {
            value: questionnaireData.bmi,
            unit: 'kg/m2',
            system: 'http://unitsofmeasure.org',
            code: 'kg/m2'
          },
          effectiveDateTime: new Date().toISOString()
        };
        observations.push(bmiObs);
      }

      // Create all observations
      for (const obs of observations) {
        try {
          const obsResponse = await axios.post(`${FHIR_SERVER_URL}/Observation`, obs, {
            headers: {
              'Content-Type': 'application/fhir+json'
            }
          });
          results.observations.push(obsResponse.data);
        } catch (obsError) {
          console.error('Error creating observation:', obsError);
          // Continue with other observations even if one fails
        }
      }

      // 3. Create Condition resources for medical conditions
      if (questionnaireData.diabetes === true || questionnaireData.diabetes === 'yes') {
        const diabetesCondition = {
          resourceType: 'Condition',
          subject: {
            reference: `Patient/${actualPatientId}`
          },
          code: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: '73211009',
              display: 'Diabetes mellitus'
            }],
            text: 'Diabetes'
          },
          clinicalStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active',
              display: 'Active'
            }]
          },
          verificationStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
              code: 'confirmed',
              display: 'Confirmed'
            }]
          },
          recordedDate: new Date().toISOString()
        };

        try {
          const conditionResponse = await axios.post(`${FHIR_SERVER_URL}/Condition`, diabetesCondition, {
            headers: {
              'Content-Type': 'application/fhir+json'
            }
          });
          results.conditions.push(conditionResponse.data);
        } catch (condError) {
          console.error('Error creating condition:', condError);
        }
      }

      // 4. Create QuestionnaireResponse resource to store all questionnaire answers
      const questionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        subject: {
          reference: `Patient/${actualPatientId}`
        },
        authored: new Date().toISOString(),
        item: []
      };

      // Add all questionnaire items
      const addItem = (linkId, text, answer) => {
        if (answer !== undefined && answer !== null && answer !== '') {
          questionnaireResponse.item.push({
            linkId: linkId,
            text: text,
            answer: Array.isArray(answer) ? answer : [{
              valueString: typeof answer === 'object' ? JSON.stringify(answer) : String(answer)
            }]
          });
        }
      };

      addItem('age', 'Age', questionnaireData.age);
      addItem('gender', 'Gender', questionnaireData.gender);
      addItem('systolicBP', 'Systolic Blood Pressure', questionnaireData.systolicBP);
      addItem('diastolicBP', 'Diastolic Blood Pressure', questionnaireData.diastolicBP);
      addItem('cholesterol', 'Total Cholesterol', questionnaireData.cholesterol);
      addItem('hdlCholesterol', 'HDL Cholesterol', questionnaireData.hdlCholesterol);
      addItem('bmi', 'Body Mass Index', questionnaireData.bmi);
      addItem('diabetes', 'Diabetes', questionnaireData.diabetes);
      addItem('smoking', 'Smoking Status', questionnaireData.smoking);
      addItem('familyHistory', 'Family History of Heart Disease', questionnaireData.familyHistory);
      addItem('physicalActivity', 'Physical Activity Level', questionnaireData.physicalActivity);
      addItem('dietQuality', 'Diet Quality', questionnaireData.dietQuality);

      try {
        const qrResponse = await axios.post(`${FHIR_SERVER_URL}/QuestionnaireResponse`, questionnaireResponse, {
          headers: {
            'Content-Type': 'application/fhir+json'
          }
        });
        results.questionnaireResponse = qrResponse.data;
      } catch (qrError) {
        console.error('Error creating QuestionnaireResponse:', qrError);
        // Continue even if QuestionnaireResponse creation fails
      }

      res.json({
        success: true,
        message: 'Questionnaire data stored successfully in FHIR',
        results: results
      });

    } catch (patientError) {
      console.error('Error creating patient in FHIR:', patientError);
      throw patientError;
    }

  } catch (error) {
    console.error('Error storing questionnaire data in FHIR:', error);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Failed to store questionnaire data in FHIR server',
        message: error.response.data,
        details: error.response.data
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
  const patient = {
    resourceType: 'Patient',
    id: patientData.id || `patient-${Date.now()}`,
    gender: patientData.gender === 'male' ? 'male' : patientData.gender === 'female' ? 'female' : 'unknown',
    birthDate: patientData.birthDate || calculateBirthDate(patientData.age),
    identifier: [
      {
        system: 'http://hospital.example.org',
        value: patientData.id || `patient-${Date.now()}`
      }
    ]
  };

  // Only add BMI extension if BMI is provided
  if (patientData.bmi !== undefined && patientData.bmi !== null) {
    patient.extension = [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-bmi',
        valueDecimal: patientData.bmi
      }
    ];
  }

  return patient;
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

