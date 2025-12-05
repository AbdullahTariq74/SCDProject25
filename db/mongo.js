const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;         // from .env
const dbName = process.env.DB_NAME;

let client;
let db;

async function connectDB() {
  if (!client || !db) {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
  }
  return db;
}

async function getCollection(collectionName) {
  const database = await connectDB();
  return database.collection(collectionName);
}

module.exports = { connectDB, getCollection };

