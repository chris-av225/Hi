module.exports = {
  config: {
    name: "out",
    version: "1.3",
    author: "TonNom",
    description: "Permet uniquement à l'admin du bot de quitter un groupe (actuel ou via UID).",
    usage: "out [UID (optionnel)]",
    permissions: [2] // 2 = admin bot
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    // Ton UID ici
    const adminIDs = ["100080479775577"];
    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("❌ Cette commande est réservée à l'administrateur du bot.", threadID);
    }

    // Si un UID de groupe est fourni
    if (args[0]) {
      const targetThreadID = args[0];

      try {
        await api.sendMessage("Bye bye 👋🏻", targetThreadID);
        await api.removeUserFromGroup(api.getCurrentUserID(), targetThreadID);
        return api.sendMessage(`✅ Groupe quitté avec succès : ${targetThreadID}`, threadID);
      } catch (err) {
        return api.sendMessage(`❌ Impossible de quitter le groupe ${targetThreadID} : ${err.message}`, threadID);
      }

    } else {
      // Quitter le groupe actuel
      try {
        await api.sendMessage("Bye bye 👋🏻", threadID);
        await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
      } catch (err) {
        return api.sendMessage(`❌ Erreur : ${err.message}`, threadID);
      }
    }
  }
};
