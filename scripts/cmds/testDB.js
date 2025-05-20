const db = require('../../database/atlas');

module.exports = {
  command: '!testsave',
  description: 'Teste la sauvegarde MongoDB',
  async execute(api, event, args) {
    const senderID = event.senderID; // ID Facebook de l'utilisateur
    const testAmount = Math.floor(Math.random() * 1000); // Montant aléatoire

    try {
      const database = await db.connect();
      await database.collection('players').updateOne(
        { _id: senderID },
        { $set: { solde: testAmount, lastTest: new Date() } },
        { upsert: true }
      );
      
      api.sendMessage(
        `✅ Données sauvegardées : ${testAmount} crédits ! (ID: ${senderID})`,
        event.threadID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage('❌ Erreur lors de la sauvegarde', event.threadID);
    }
  }
};
