# Testing Guide for FHIR Questionnaire Storage

This guide will help you test the FHIR storage functionality for questionnaire data.

## Prerequisites

1. **Node.js** (v14 or higher) installed
2. **FHIR Server** - You'll need a FHIR server running. Options:
   - **HAPI FHIR Server** (Recommended for testing)
   - **Public FHIR test servers** (e.g., `https://hapi.fhir.org/baseR4`)
   - **Local HAPI FHIR Server** (Docker or standalone)

## Step 1: Set Up FHIR Server

### Option A: Use Public HAPI FHIR Test Server (Easiest for Quick Testing)

No setup needed! The default configuration uses `http://localhost:8080/fhir`, but you can use the public test server.

### Option B: Run HAPI FHIR Server Locally with Docker

```bash
# Run HAPI FHIR Server in Docker
docker run -p 8080:8080 hapiproject/hapi:latest

# The server will be available at http://localhost:8080/fhir
```

### Option C: Use Public Test Server

You can use the public HAPI FHIR test server at `https://hapi.fhir.org/baseR4` (no authentication required for testing).

## Step 2: Configure Environment Variables

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a `.env` file:
```bash
cp env.example .env
```

3. Edit `.env` and set your FHIR server URL:

**For local HAPI FHIR:**
```
PORT=5000
FHIR_SERVER_URL=http://localhost:8080/fhir
NODE_ENV=development
OPENAI_API_KEY=your_key_here  # Optional, only needed for chatbot
```

**For public test server:**
```
PORT=5000
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
NODE_ENV=development
OPENAI_API_KEY=your_key_here  # Optional, only needed for chatbot
```

## Step 3: Install Dependencies and Start Servers

### Backend

```bash
cd backend
npm install
npm start
# Or for development with auto-reload:
npm run dev
```

The backend should start on `http://localhost:5000`

### Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend should open at `http://localhost:3000`

## Step 4: Testing Methods

### Method 1: Test Through the UI (Recommended)

1. Open `http://localhost:3000` in your browser
2. Click **"Fill Out Questionnaire"**
3. Fill in the form with test data:
   - Age: 45
   - Gender: Male
   - Systolic BP: 140
   - Diastolic BP: 90
   - Cholesterol: 220
   - HDL Cholesterol: 45
   - BMI: 28
   - Diabetes: Yes
   - Smoking: Current
   - Family History: Yes
   - Physical Activity: Moderate
   - Diet Quality: Good
4. Click **"Submit & Continue"**
5. Check the browser console (F12 → Console tab) for success messages
6. The data should be stored in FHIR automatically

### Method 2: Test API Endpoint Directly with cURL

```bash
curl -X POST http://localhost:5000/api/fhir/questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "age": 45,
    "gender": "male",
    "systolicBP": 140,
    "diastolicBP": 90,
    "cholesterol": 220,
    "hdlCholesterol": 45,
    "bmi": 28,
    "diabetes": true,
    "smoking": "current",
    "familyHistory": true,
    "physicalActivity": "moderate",
    "dietQuality": "good"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Questionnaire data stored successfully in FHIR",
  "results": {
    "patient": { ... },
    "patientId": "patient-...",
    "observations": [ ... ],
    "questionnaireResponse": { ... },
    "conditions": [ ... ]
  }
}
```

### Method 3: Test with Postman or Insomnia

1. Create a new POST request
2. URL: `http://localhost:5000/api/fhir/questionnaire`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "age": 45,
  "gender": "male",
  "systolicBP": 140,
  "diastolicBP": 90,
  "cholesterol": 220,
  "hdlCholesterol": 45,
  "bmi": 28,
  "diabetes": true,
  "smoking": "current",
  "familyHistory": true,
  "physicalActivity": "moderate",
  "dietQuality": "good"
}
```

## Step 5: Verify Data in FHIR Server

### For Local HAPI FHIR Server

1. Open HAPI FHIR UI: `http://localhost:8080`
2. Navigate to the "Browse" section
3. Check for:
   - **Patient** resources
   - **Observation** resources (blood pressure, cholesterol, BMI)
   - **Condition** resources (diabetes)
   - **QuestionnaireResponse** resources

### For Public Test Server

1. Visit: `https://hapi.fhir.org/baseR4/Patient?_count=10&_sort=-_lastUpdated`
2. Look for recently created Patient resources
3. Use the patient ID to check observations:
   - `https://hapi.fhir.org/baseR4/Observation?subject=Patient/{patient-id}`

### Using cURL to Query

```bash
# Get all patients
curl http://localhost:8080/fhir/Patient

# Get observations for a specific patient (replace {patient-id})
curl http://localhost:8080/fhir/Observation?subject=Patient/{patient-id}

# Get questionnaire responses
curl http://localhost:8080/fhir/QuestionnaireResponse
```

## Step 6: Check Backend Logs

Watch the backend terminal for:
- ✅ Success messages when resources are created
- ❌ Error messages if FHIR server is unreachable
- 📝 Logs showing which resources were created

## Troubleshooting

### Error: "Failed to connect to FHIR server"

**Solution:**
- Verify your FHIR server is running
- Check the `FHIR_SERVER_URL` in your `.env` file
- Test the FHIR server directly: `curl http://localhost:8080/fhir/metadata`

### Error: "Failed to create patient in FHIR server"

**Solution:**
- Check FHIR server logs
- Verify the FHIR server supports the resource types (Patient, Observation, etc.)
- For public servers, check if there are rate limits

### Data not appearing in FHIR server

**Solution:**
- Check browser console for errors
- Check backend terminal logs
- Verify the FHIR server URL is correct
- Try querying the FHIR server directly

### Frontend shows errors but continues

**Note:** The application is designed to continue even if FHIR storage fails. Check:
- Browser console (F12) for detailed error messages
- Backend terminal for server-side errors
- Network tab in browser DevTools to see the API request/response

## Expected Behavior

When questionnaire data is submitted:

1. ✅ **Patient Resource** is created with:
   - Gender
   - Birth date (calculated from age)
   - Identifier

2. ✅ **Observation Resources** are created for:
   - Blood Pressure (if systolic/diastolic provided)
   - Total Cholesterol (if provided)
   - HDL Cholesterol (if provided)
   - BMI (if provided)

3. ✅ **Condition Resource** is created for:
   - Diabetes (if diabetes = true/yes)

4. ✅ **QuestionnaireResponse Resource** is created with:
   - All questionnaire answers
   - Reference to the patient
   - Timestamp

## Testing Checklist

- [ ] FHIR server is running and accessible
- [ ] Backend server is running on port 5000
- [ ] Frontend is running on port 3000
- [ ] `.env` file is configured correctly
- [ ] Can submit questionnaire through UI
- [ ] Can see success message in console
- [ ] Patient resource exists in FHIR server
- [ ] Observation resources exist in FHIR server
- [ ] QuestionnaireResponse exists in FHIR server
- [ ] Condition resource exists (if diabetes is present)

## Quick Test Script

Save this as `test-fhir.sh`:

```bash
#!/bin/bash

echo "Testing FHIR Questionnaire Endpoint..."
echo ""

curl -X POST http://localhost:5000/api/fhir/questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "age": 45,
    "gender": "male",
    "systolicBP": 140,
    "diastolicBP": 90,
    "cholesterol": 220,
    "hdlCholesterol": 45,
    "bmi": 28,
    "diabetes": true,
    "smoking": "current",
    "familyHistory": true,
    "physicalActivity": "moderate",
    "dietQuality": "good"
  }' | jq '.'

echo ""
echo "Test complete!"
```

Make it executable: `chmod +x test-fhir.sh`
Run it: `./test-fhir.sh`

