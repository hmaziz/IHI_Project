// Simple Appwrite Node-22 function for chatbotStart
(async () => {
  try {
    const raw = process.env.APPWRITE_FUNCTION_DATA || '{}';
    // Some callers send raw stringified JSON in `data` field; attempt to parse twice safely
    let payload = {};
    try {
      const outer = JSON.parse(raw);
      // If callers sent { data: "{...}" }
      if (outer && outer.data && typeof outer.data === 'string') {
        payload = JSON.parse(outer.data);
      } else {
        payload = outer;
      }
    } catch (e) {
      // fallback: try parse raw directly
      try { payload = JSON.parse(raw); } catch (e2) { payload = {}; }
    }

    const sessionId = payload.sessionId || `session_${Date.now()}`;
    const welcomeMessage = 'Hello! I\'m here to help you assess your risk for heart disease. What is your age?';

    const result = { sessionId, welcomeMessage };
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify({ success: false, error: String(err) }));
    process.exit(1);
  }
})();
