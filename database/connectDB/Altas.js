// database/atlas.js
const { MongoClient } = require('mongodb');
const config = require('../config.dev.json'); // Adapte le chemin si nécessaire

const uri = config.MONGODB_URI || "mongodb+srv://evaelfiieiy:motdepasse@cluster1.aygslzu.mongodb.net/?retryWrite=true&w=majority&appName=Cluster1";

let client;
let db;

async function connect() {
  if (db) return db; // Connexion existante
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('sicbo_bot'); // Nom de ta base
    console.log('✅ Connecté à MongoDB Atlas');
    return db;
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
}

module.exports = { connect };
