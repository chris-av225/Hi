const { config } = global.GoatBot;

module.exports = {
  config: {
    name: "lgc",
    aliases: [],
    version: "1.1",
    author: "Blẳȼk",
    countDown: 5,
    role: 2, // réservée aux admins du bot
    shortDescription: "Voir les groupes actifs du bot",
    longDescription: "Affiche la liste des groupes où le bot est encore membre, triés par nombre de membres.",
    category: "𝗢𝗪𝗡𝗘𝗥",
    guide: "{pn}"
  },

  onStart: async function ({ message, api, event }) {
    if (!config.adminBot.includes(event.senderID)) {
      return message.reply("❌ | Tu n'as pas la permission d'utiliser cette commande.");
    }

    try {
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      const groupes = threads.filter(g => g.isGroup && g.name && !g.name.includes("undefined"));

      const groupesInfos = [];

      for (const g of groupes) {
        try {
          const info = await api.getThreadInfo(g.threadID);
          groupesInfos.push({
            name: info.threadName || "Sans nom",
            tid: g.threadID,
            membres: info.participantIDs.length
          });
        } catch (e) {
          // ignore les groupes inaccessibles
        }
      }

      if (groupesInfos.length === 0) return message.reply("❌ Aucun groupe accessible.");

      // tri décroissant
      groupesInfos.sort((a, b) => b.membres - a.membres);

      let texte = `📋 𝗟𝗜𝗦𝗧𝗘 𝗗𝗘𝗦 𝗚𝗥𝗢𝗨𝗣𝗘𝗦 𝗔𝗖𝗧𝗜𝗙𝗦\n━━━━━━━━━━━━━━━━━━\n`;

      for (const g of groupesInfos) {
        texte += `🏷️ Nom : *${g.name}*\n`;
        texte += `🆔 TID : \`${g.tid}\`\n`;
        texte += `👥 Membres : ${g.membres}\n`;
        texte += `━━━━━━━━━━━━━━━━━━\n`;
      }

      texte += `✅ Total : ${groupesInfos.length} groupes.`

      return message.reply(texte);
    } catch (err) {
      console.error(err);
      return message.reply("⚠️ Une erreur est survenue lors de la récupération des groupes.");
    }
  }
};