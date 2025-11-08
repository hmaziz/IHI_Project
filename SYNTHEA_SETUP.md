# Synthea Database Comparison Setup

The application now includes full Synthea database comparison functionality. Patient data is automatically compared to Synthea database averages and displayed in the risk assessment results.

## How It Works

1. **Data Loading**: The system looks for Synthea JSON files in `backend/data/synthea/`
2. **Statistics Calculation**: Extracts Patient and Observation resources to calculate averages
3. **Comparison**: Compares patient input data to Synthea database averages
4. **Display**: Shows comparisons in the Risk Results screen with insights

## Setting Up Synthea Data

### Option 1: Place Synthea JSON Files

1. Place your Synthea-generated FHIR JSON files in:
   ```
   backend/data/synthea/
   ```

2. The system will automatically:
   - Scan all `.json` files (including subdirectories)
   - Parse FHIR resources (Patient, Observation)
   - Calculate statistics (averages, medians)
   - Use them for comparisons

### Option 2: Use Custom Directory

Set environment variable in `backend/.env`:
```
SYNTHEA_DATA_DIR=/path/to/your/synthea/data
```

### Option 3: Use FHIR Server

If Synthea data is loaded in your FHIR server, the system will query it automatically as a fallback.

## Supported Data

The system extracts and compares:
- **Systolic Blood Pressure** (LOINC: 8480-6)
- **Diastolic Blood Pressure** (LOINC: 8462-4)
- **Total Cholesterol** (LOINC: 2093-3)
- **HDL Cholesterol** (LOINC: 2085-9)
- **BMI** (LOINC: 39156-5)
- **Age** (from Patient birthDate)

## Checking Synthea Data Status

Check if Synthea data is loaded:

```bash
curl http://localhost:5000/api/risk-assessment/synthea-status
```

Response:
```json
{
  "success": true,
  "syntheaDataAvailable": true,
  "statistics": {
    "systolicBP": { "count": 1250, "average": 122.5 },
    "diastolicBP": { "count": 1250, "average": 78.3 },
    "cholesterol": { "count": 980, "average": 198.2 },
    "hdlCholesterol": { "count": 980, "average": 52.1 },
    "bmi": { "count": 1100, "average": 27.3 },
    "age": { "count": 1500, "average": 48.5 }
  },
  "dataSource": "synthea",
  "dataDirectory": "/path/to/data/synthea"
}
```

## What You'll See

In the Risk Results screen, you'll see a **"Comparison with Database Averages"** section showing:

- **Your Value** vs **Database Average** for each metric
- **Percentage difference** and insights
- **Recommendations** based on how you compare

Example:
- "Your systolic BP is 15.2% higher than the database average"
- "Your cholesterol is similar to the database average (2.1% difference)"
- "Your HDL is 18.5% higher than average (good!)"

## Features

✅ **Automatic Comparison**: Enabled by default for all risk assessments  
✅ **Always Shows**: Comparisons are shown even when values are similar  
✅ **Multiple Data Sources**: Tries Synthea files → FHIR server → Defaults  
✅ **Real Statistics**: Calculates actual averages and medians from your data  
✅ **Insights**: Provides contextual recommendations based on comparisons  

## Troubleshooting

### No Comparisons Showing

1. Check if Synthea data is loaded:
   ```bash
   curl http://localhost:5000/api/risk-assessment/synthea-status
   ```

2. Verify files are in the correct directory:
   ```
   backend/data/synthea/
   ```

3. Check file format - should be valid JSON with FHIR resources

4. Check backend console logs for loading messages

### Using Default Statistics

If no Synthea data is found, the system uses general population defaults:
- Systolic BP: 120 mmHg
- Diastolic BP: 80 mmHg
- Cholesterol: 200 mg/dL
- HDL: 50 mg/dL
- BMI: 26.5

These will still show comparisons, but will be marked as "default" source.

## Example Synthea File Structure

Synthea files can be:
- Single resources: `{ "resourceType": "Patient", ... }`
- Bundles: `{ "resourceType": "Bundle", "entry": [...] }`
- Arrays: `[{ "resourceType": "Patient", ... }, ...]`

The loader handles all formats automatically.

