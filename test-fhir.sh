#!/bin/bash

echo "🧪 Testing FHIR Questionnaire Endpoint..."
echo ""

# Test data
TEST_DATA='{
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

echo "📤 Sending test data to /api/fhir/questionnaire..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:5000/api/fhir/questionnaire \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

# Check if jq is available for pretty printing
if command -v jq &> /dev/null; then
  echo "$RESPONSE" | jq '.'
else
  echo "$RESPONSE"
fi

echo ""
echo "✅ Test complete!"
echo ""
echo "💡 Tip: Check your FHIR server to verify the resources were created."

