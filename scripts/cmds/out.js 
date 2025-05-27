module.exports = {
  config: {
    name: "out",
    version: "1.1",
    author: "VotreNom",
    description: "Fait quitter le bot du groupe actuel ou d'un groupe spécifique.",
    usage: "out [uid]",
    cooldown: 3,
    permissions: [2], // 2 = admin du groupe
  },

  onStart: async function ({ api, event, args }) {
    const threadID = args[0] || event.threadID;

    try {
      // Envoyer le message d'au revoir
      await api.sendMessage("Bye bye 👋🏻", threadID);

      // Quitter le groupe
      await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    } catch (error) {
      api.sendMessage("❌ Impossible de quitter le groupe. Vérifiez les permissions ou l'UID.", event.threadID);
      console.error(error);
    }
  }
};