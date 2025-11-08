# Synthea Data Directory

Place your Synthea-generated FHIR JSON files in this directory.

## Supported Formats

The loader supports:
- Single FHIR resource JSON files
- FHIR Bundle JSON files
- Arrays of FHIR resources

## File Structure

You can organize files in any structure:
```
data/synthea/
├── patient_001.json
├── patient_002.json
├── observations.json
└── subdirectory/
    └── more_data.json
```

## How It Works

1. The system scans this directory (and subdirectories) for `.json` files
2. Parses each JSON file looking for FHIR resources
3. Extracts Patient and Observation resources
4. Calculates statistics (averages, medians) for:
   - Blood Pressure (Systolic and Diastolic)
   - Total Cholesterol
   - HDL Cholesterol
   - BMI
   - Age

## Example Synthea File

Synthea files typically contain FHIR resources like:

```json
{
  "resourceType": "Bundle",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-1",
        "birthDate": "1980-01-15",
        "gender": "male"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "code": {
          "coding": [{
            "system": "http://loinc.org",
            "code": "85354-9",
            "display": "Blood pressure panel"
          }],
          "component": [
            {
              "code": {
                "coding": [{
                  "code": "8480-6",
                  "display": "Systolic blood pressure"
                }]
              },
              "valueQuantity": {
                "value": 120,
                "unit": "mmHg"
              }
            }
          ]
        }
      }
    }
  ]
}
```

## Environment Variable

You can set a custom data directory using:
```
SYNTHEA_DATA_DIR=/path/to/your/synthea/data
```

Default location: `backend/data/synthea`

