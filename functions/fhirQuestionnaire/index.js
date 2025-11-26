// Simple Appwrite Node-22 function to store questionnaire data in FHIR (stub for demo)
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

    // In production, you'd call your FHIR server here.
    const fakePatientId = `patient_${Date.now()}`;
    console.log(JSON.stringify({ success: true, results: { patientId: fakePatientId } }));
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify({ success: false, error: String(err) }));
    process.exit(1);
  }
})();
