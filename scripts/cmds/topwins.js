const fs = require("fs");
const path = require("path");
const winsFile = path.join(__dirname, "snake_wins.json");

module.exports = {
  config: {
    name: "topwins",
    version: "1.0",
    author: "Blẳȼk",
    description: "Affiche le classement des meilleurs joueurs Snake",
    category: "game",
    usage: "",
    cooldown: 5
  },

  onStart: async function ({ message, usersData }) {
    if (!fs.existsSync(winsFile)) return message.reply("❌ Le fichier de victoires `snake_wins.json` est introuvable.");

    let winData = {};
    try {
      winData = JSON.parse(fs.readFileSync(winsFile, "utf8"));
    } catch (err) {
      return message.reply("⚠️ Erreur de lecture du fichier des victoires.");
    }

    if (Object.keys(winData).length === 0) return message.reply("Aucun joueur n’a encore gagné de partie.");

    // Trier par nombre de victoires décroissant
    const sorted = Object.entries(winData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 max

    const lines = await Promise.all(sorted.map(async ([uid, wins], i) => {
      const name = await usersData.getName(uid) || `ID:${uid}`;
      return `${i + 1}. ${name} - 🏆 ${wins} victoire(s)`;
    }));

    message.reply("🏅 **Top joueurs Snake** 🐍\n\n" + lines.join("\n"));
  }
};