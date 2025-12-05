const { getCollection } = require('./mongo');
const recordUtils = require('./record');
const vaultEvents = require('../events');
const fs = require('fs');
const path = require('path');

const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

async function createBackup(records) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupsDir, `backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(records, null, 2));
  console.log(`💾 Backup created: ${backupFile}`);
}

async function addRecord({ name, value }) {
  recordUtils.validateRecord({ name, value });
  const collection = await getCollection(process.env.COLLECTION_NAME);

  const newRecord = {
    id: recordUtils.generateId(),
    name,
    value,
    created: new Date().toISOString()
  };

  await collection.insertOne(newRecord);
  vaultEvents.emit('recordAdded', newRecord);

  const allRecords = await collection.find().toArray();
  await createBackup(allRecords);

  return newRecord;
}

async function listRecords() {
  const collection = await getCollection(process.env.COLLECTION_NAME);
  return await collection.find().toArray();
}

async function updateRecord(id, newName, newValue) {
  const collection = await getCollection(process.env.COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { id: id },
    { $set: { name: newName, value: newValue } },
    { returnDocument: 'after' }
  );

  if (!result.value) return null;

  vaultEvents.emit('recordUpdated', result.value);

  const allRecords = await collection.find().toArray();
  await createBackup(allRecords);

  return result.value;
}

async function deleteRecord(id) {
  const collection = await getCollection(process.env.COLLECTION_NAME);

  const record = await collection.findOneAndDelete({ id: id });
  if (!record.value) return null;

  vaultEvents.emit('recordDeleted', record.value);

  const allRecords = await collection.find().toArray();
  await createBackup(allRecords);

  return record.value;
}

async function exportVault() {
  const collection = await getCollection(process.env.COLLECTION_NAME);
  const data = await collection.find().toArray();

  const filePath = path.join(__dirname, '..', 'export.txt');
  const header = `Export Date: ${new Date().toLocaleString()}\nTotal Records: ${data.length}\nFile: export.txt\n====================\n`;

  const content = data.map(r => `ID: ${r.id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.created}`).join('\n');

  fs.writeFileSync(filePath, header + content, 'utf8');

  return filePath;
}

async function vaultStats() {
  const collection = await getCollection(process.env.COLLECTION_NAME);
  const data = await collection.find().toArray();
  if (data.length === 0) return null;

  const totalRecords = data.length;

  // MongoDB does not store file timestamps; fallback to latest record created
  const lastModified = new Date(Math.max(...data.map(r => new Date(r.created)))).toLocaleString();

  const longestNameObj = data.reduce((max, r) => r.name.length > max.name.length ? r : max, data[0]);
  const earliest = data.reduce((min, r) => new Date(r.created) < new Date(min.created) ? r : min, data[0]);
  const latest = data.reduce((max, r) => new Date(r.created) > new Date(max.created) ? r : max, data[0]);

  return {
    totalRecords,
    lastModified,
    longestName: `${longestNameObj.name} (${longestNameObj.name.length} characters)`,
    earliest: earliest.created.split('T')[0],
    latest: latest.created.split('T')[0]
  };
}


async function searchRecords(keyword) {
  const collection = await getCollection(process.env.COLLECTION_NAME);
  const lower = keyword.toLowerCase();

  return await collection
    .find({
      $or: [
        { name: { $regex: lower, $options: 'i' } },
        { id: { $regex: lower } }
      ]
    })
    .toArray();
}

module.exports = {
  addRecord,
  listRecords,
  updateRecord,
  deleteRecord,
  searchRecords,
  createBackup,
  exportVault,
  vaultStats
};


