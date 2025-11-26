// Simple Appwrite Node-22 function for riskAssessmentCalculate (standalone)
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

    const patient = payload || {};
    const score = (patient.age ? patient.age * 0.25 : 8) + (patient.bmi ? patient.bmi * 0.12 : 0);
    const riskAssessment = { score: Number(score.toFixed(2)), percent: `${Math.min(score, 99).toFixed(1)}%` };
    const recommendations = ['Schedule follow-up', 'Lifestyle modification', 'Assess labs'];

    console.log(JSON.stringify({ success: true, riskAssessment, recommendations }));
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify({ success: false, error: String(err) }));
    process.exit(1);
  }
})();
