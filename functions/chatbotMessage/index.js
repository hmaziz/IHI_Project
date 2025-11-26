// Simple Appwrite Node-22 function for chatbotMessage
(async () => {
  try {
    const raw = process.env.APPWRITE_FUNCTION_DATA || '{}';
    let payload = {};
    try {
      const outer = JSON.parse(raw);
      if (outer && outer.data && typeof outer.data === 'string') {
        payload = JSON.parse(outer.data);
      } else {
        payload = outer;
      }
    } catch (e) {
      try { payload = JSON.parse(raw); } catch (e2) { payload = {}; }
    }

    const message = payload.message || '';
    // Very small deterministic reply for testing. Replace with AI/model logic in production.
    const responseText = `Received: ${message}`;

    // Example: if message contains 'calculate' return a sample riskAssessment
    let riskAssessment;
    let recommendations;
    if (/calculate|risk|assess/i.test(message)) {
      riskAssessment = { score: 12.3, percent: '12.3%' };
      recommendations = ['Increase exercise', 'Reduce sodium intake'];
    }

    const result = {
      response: responseText,
      collectedData: payload.collectedData || {},
      hasEnoughData: Boolean(payload.collectedData && Object.keys(payload.collectedData).length >= 5),
      riskAssessment,
      recommendations
    };

    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify({ success: false, error: String(err) }));
    process.exit(1);
  }
})();
