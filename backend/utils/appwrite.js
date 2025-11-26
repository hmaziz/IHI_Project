const { Client, Account, Databases } = require('appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69267ca6003aab81f3d0');

const account = new Account(client);
const databases = new Databases(client);

// Ping Appwrite at startup to verify connectivity. This runs when the module is required.
client
  .ping()
  .then(() => console.log('Appwrite ping succeeded'))
  .catch((err) => console.warn('Appwrite ping failed:', err.message || err));

module.exports = { client, account, databases };
