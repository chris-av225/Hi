const { MongoClient } = require('mongodb');
const config = require('../config.dev.json');

class AtlasDB {
  constructor() {
    this.client = null;
    this.db = null;
    this.uri = config.MONGODB_URI;
  }

  async connect() {
    if (this.db) return this.db;
    
    try {
      this.client = new MongoClient(this.uri, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 50
      });
      
      await this.client.connect();
      this.db = this.client.db('sicbo_bot');
      console.log('🔌 Connecté à MongoDB Atlas');
      return this.db;
    } catch (err) {
      console.error('❌ Erreur de connexion:', err.message);
      throw err;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

module.exports = new AtlasDB();
