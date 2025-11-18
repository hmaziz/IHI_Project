# Testing OpenAI API Key

This guide shows you how to test if your OpenAI API key is valid and working.

## Method 1: Using Jest Tests (Recommended)

### Step 1: Update your `.env` file

Make sure your `.env` file in the `backend` directory has your OpenAI API key:

```
OPENAI_API_KEY=sk-abcd1234efgh5678abcd1234efgh5678abcd1234
```

### Step 2: Run the test

```bash
cd backend
npm test -- tests/openai.test.js
```

Or run all tests:

```bash
npm test
```

### What the test checks:

1. ✅ **API Key Format**: Validates that the key starts with "sk-" and has proper length
2. ✅ **Authentication**: Tests if the API key can authenticate with OpenAI
3. ✅ **Chat Completion**: Tests if you can make a simple chat completion request

## Method 2: Using the API Endpoint

### Step 1: Start the backend server

```bash
cd backend
npm start
```

### Step 2: Test the endpoint

Using curl:

```bash
curl http://localhost:5000/api/chatbot/test-openai
```

Or using a browser:
- Navigate to: `http://localhost:5000/api/chatbot/test-openai`

### Expected Response (Success):

```json
{
  "success": true,
  "message": "OpenAI API key is valid and working",
  "apiKeyConfigured": true,
  "modelsAvailable": 50,
  "testResponse": "test",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Expected Response (Invalid Key):

```json
{
  "success": false,
  "error": "OpenAI API key is invalid or unauthorized",
  "message": "Please check your API key in the .env file"
}
```

## Method 3: Using Environment Variable (Quick Test)

You can also test with a different API key without modifying the `.env` file:

```bash
cd backend
OPENAI_API_KEY=your-actual-api-key-here npm test -- tests/openai.test.js
```

## Troubleshooting

### Error: "OpenAI API key is invalid or unauthorized"

- Check that your API key is correct in the `.env` file
- Make sure there are no extra spaces or quotes around the key
- Verify that the API key hasn't expired or been revoked
- Ensure you have credits/quota available in your OpenAI account

### Error: "OpenAI API rate limit exceeded"

- You've hit the rate limit. Wait a few minutes and try again
- Consider upgrading your OpenAI plan if this happens frequently

### Error: "OPENAI_API_KEY not set"

- Make sure your `.env` file exists in the `backend` directory
- Verify the `.env` file has the `OPENAI_API_KEY` variable set
- Restart your backend server after updating `.env`

## Notes

- The test uses `gpt-3.5-turbo` for the chat completion test (cheaper and faster than gpt-4)
- All tests have a 30-second timeout to account for API latency
- The API endpoint test makes actual API calls which may incur minimal costs

