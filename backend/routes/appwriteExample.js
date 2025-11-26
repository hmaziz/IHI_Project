const express = require('express');
const router = express.Router();
const { account, databases } = require('../utils/appwrite');

// Returns the current account (requires an authenticated session/cookie)
router.get('/account', async (req, res) => {
  try {
    const result = await account.get();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || String(err), hint: 'This endpoint may require an authenticated session (cookies).' });
  }
});

// List documents from a collection. Query params: databaseId, collectionId
router.get('/documents', async (req, res) => {
  const { databaseId, collectionId } = req.query;
  if (!databaseId || !collectionId) {
    return res.status(400).json({ error: 'Missing query params: databaseId and collectionId are required' });
  }

  try {
    const result = await databases.listDocuments(databaseId, collectionId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

module.exports = router;
