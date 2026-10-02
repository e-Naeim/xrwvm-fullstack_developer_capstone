// Local development uses a real MongoDB process, downloaded from MongoDB's vendor.
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const { app, initialize } = require('../app');
(async () => {
  const dbPath = path.join(__dirname, '../.local-mongo');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' },
    instance: { dbPath, storageEngine: 'wiredTiger' } });
  await initialize(mongo.getUri('dealershipsDB'));
  const server = app.listen(3030, '0.0.0.0', () => console.log('Real MongoDB and Express running on port 3030'));
  process.on('SIGINT', async () => { server.close(); await mongo.stop(); process.exit(0); });
})().catch(err => { console.error(err); process.exit(1); });
