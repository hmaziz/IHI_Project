# FHIR Storage Status Report

## Test Data Submitted
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

## Status: ❌ NOT STORED

**Reason**: FHIR server is not running or not accessible.

**Error**: `connect ECONNREFUSED ::1:8080`

## What Happened

1. ✅ Questionnaire form accepted the data
2. ✅ Data was sent to backend `/api/fhir/questionnaire` endpoint
3. ❌ Backend tried to connect to FHIR server at `http://localhost:8080/fhir`
4. ❌ Connection failed - server not running
5. ✅ Application continued (showed summary and risk assessment)
6. ❌ FHIR resources were NOT created

## How to Fix

### Option 1: Use Public FHIR Test Server (Recommended for Testing)

1. **Restart the backend server** to load new environment variable:
   ```bash
   # Stop the current backend (Ctrl+C in the terminal running it)
   # Then restart:
   cd backend
   npm start
   ```

2. The `.env` file has been updated to:
   ```
   FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
   ```

3. **Test again** by submitting the questionnaire through the UI

### Option 2: Start Local HAPI FHIR Server

```bash
# Using Docker
docker run -p 8080:8080 hapiproject/hapi:latest

# Keep this running, then restart your backend
```

### Option 3: Check Browser Console

When you submit the questionnaire:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages like:
   - ✅ `"Questionnaire data stored in FHIR"` = Success
   - ❌ `"Error storing data in FHIR"` = Failed

## Verify Storage

After fixing the FHIR server, you can verify storage by:

1. **Check the response** in browser console or network tab
2. **Query FHIR server**:
   ```bash
   # For public server
   curl https://hapi.fhir.org/baseR4/Patient?_count=10&_sort=-_lastUpdated
   
   # For local server
   curl http://localhost:8080/fhir/Patient?_count=10
   ```

## Expected FHIR Resources Created

When storage succeeds, the following resources should be created:

1. **Patient Resource** - Basic demographics
2. **Observation Resources**:
   - Blood Pressure (systolic + diastolic)
   - Total Cholesterol
   - HDL Cholesterol
   - BMI
3. **Condition Resource** - Diabetes (if present)
4. **QuestionnaireResponse Resource** - All questionnaire answers

## Current Configuration

- **Backend**: ✅ Running on port 5000
- **Frontend**: ✅ Running on port 3000
- **FHIR Server**: ❌ Not accessible (localhost:8080)
- **Updated Config**: ✅ Set to use public test server (needs restart)

## Next Steps

1. **Restart backend server** to use public FHIR server
2. **Resubmit the questionnaire** through the UI
3. **Check browser console** for success/error messages
4. **Verify in FHIR server** that resources were created

