// Appwrite helper: initializes client and provides a simple Functions executor
import axios from 'axios';
// Optional SDK import left here for future use if `appwrite` is installed
// import { Client, Account, Databases, Functions, Storage } from 'appwrite';

const APPWRITE_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT = '69267ca6003aab81f3d0';

// Map logical function keys to actual Appwrite Function IDs.
// Replace the placeholder values below with your actual Appwrite Function IDs (found in Appwrite console).
const FUNCTION_IDS = {
  chatbotStart: 'CHATBOT_START_FUNCTION_ID',
  chatbotMessage: 'CHATBOT_MESSAGE_FUNCTION_ID',
  chatbotCalculateRisk: 'CHATBOT_CALCULATE_FUNCTION_ID',
  fhirQuestionnaire: 'FHIR_QUESTIONNAIRE_FUNCTION_ID',
  riskAssessmentCalculate: 'RISK_ASSESSMENT_FUNCTION_ID'
};

export const endpoint = APPWRITE_ENDPOINT;
export const projectId = APPWRITE_PROJECT;

// Execute an Appwrite Function via the REST endpoint. Returns parsed JSON from the function.
export async function executeFunction(key, payload = {}) {
  const functionId = FUNCTION_IDS[key];
  if (!functionId) {
    throw new Error(`No function configured for key: ${key}`);
  }

  const url = `${APPWRITE_ENDPOINT}/functions/${functionId}/executions`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT
  };

  try {
    // Appwrite expects the payload in a `data` field (string). Wrap payload accordingly.
    const body = { data: JSON.stringify(payload || {}) };
    const response = await axios.post(url, body, { headers });
    return response.data;
  } catch (err) {
    // Add helpful debug information so frontend logs show Appwrite responses
    if (err.response) {
      console.error('Appwrite function error', { status: err.response.status, data: err.response.data });
      throw new Error(`Appwrite function call failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
    }
    console.error('Appwrite function call failed', err.message || err);
    throw err;
  }
}

// Export placeholders for SDK clients if project adds `appwrite` package later
export const sdk = {
  // client: new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT),
  // account: new Account(client),
  // databases: new Databases(client),
  // functions: new Functions(client),
  // storage: new Storage(client),
};

const appwrite = {
  executeFunction,
  endpoint: APPWRITE_ENDPOINT,
  projectId: APPWRITE_PROJECT,
};

export default appwrite;
