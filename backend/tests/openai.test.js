const OpenAI = require('openai');
require('dotenv').config();

describe('OpenAI API Key Validation', () => {
  let openai;
  
  beforeAll(() => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OPENAI_API_KEY not set or is still the placeholder value. Please set it in .env file');
    }
    
    openai = new OpenAI({
      apiKey: apiKey
    });
  });

  test('should have a valid API key format', () => {
    const apiKey = process.env.OPENAI_API_KEY;
    // OpenAI API keys typically start with 'sk-' and are at least 20 characters long
    expect(apiKey).toBeDefined();
    expect(apiKey.length).toBeGreaterThan(20);
    expect(apiKey.startsWith('sk-')).toBe(true);
  });

  test('should successfully authenticate with OpenAI API', async () => {
    // Make a simple API call to validate the key
    // Using models.list() is a lightweight call that just requires authentication
    try {
      const response = await openai.models.list();
      
      // If we get here without an error, the API key is valid
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      console.log('✓ OpenAI API key is valid!');
      console.log(`✓ Successfully connected to OpenAI API`);
    } catch (error) {
      // Check for specific authentication errors
      if (error.status === 401) {
        throw new Error('OpenAI API key is invalid or unauthorized');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else {
        throw error;
      }
    }
  }, 30000); // 30 second timeout for API call

  test('should be able to make a simple chat completion request', async () => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say "Hello" and nothing else.' }
        ],
        max_tokens: 10
      });

      expect(completion).toBeDefined();
      expect(completion.choices).toBeDefined();
      expect(completion.choices.length).toBeGreaterThan(0);
      expect(completion.choices[0].message).toBeDefined();
      expect(completion.choices[0].message.content).toBeDefined();
      
      console.log('✓ Chat completion test successful!');
      console.log(`✓ Response: ${completion.choices[0].message.content.trim()}`);
    } catch (error) {
      if (error.status === 401) {
        throw new Error('OpenAI API key is invalid or unauthorized');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else if (error.message && error.message.includes('model')) {
        throw new Error(`Model not available: ${error.message}`);
      } else {
        throw error;
      }
    }
  }, 30000); // 30 second timeout for API call
});

