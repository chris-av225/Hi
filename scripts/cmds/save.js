//Attention, cette cmd n'est pas a partagé du tout, je vous le déconseille car elle renderais vos info publique facilement.
Uniquement disponible sur RavenBot. Suivez la description sur le bot pour avoir votre token .

const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "save",
    version: "1.0",
    author: "JulioRaven",
    category: "admin",
    description: "Enregistre une commande locale dans le repo GitHub",
  },

  async handleCommand({ message, event, args }) {
    const permission = [""]; // ton ID ici
    if (!permission.includes(event.senderID)) {
      return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
    }

    if (!args[0]) {
      return message.reply("Spécifie le nom de la commande à enregistrer (sans extension).");
    }

    const fileName = args[0].endsWith(".js") ? args[0] : `${args[0]}.js`;
    const filePath = path.join(__dirname, "..", "cmds", fileName);

    if (!fs.existsSync(filePath)) {
      return message.reply("Fichier introuvable dans le dossier cmds.");
    }

    const fileContent = fs.readFileSync(filePath, "utf8");

    // Config GitHub
    const GITHUB_TOKEN = "";//le token de ton GitHub 
    const REPO_OWNER = "";//ton Nom d'utilisateurs
    const REPO_NAME = "";//le nom de ton repositoire
    const BRANCH = "main";
    const GITHUB_PATH = `scripts/cmds/${fileName}`;
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${GITHUB_PATH}`;

    try {
      // Vérifie si le fichier existe déjà (pour récupérer le SHA)
      let sha;
      try {
        const { data } = await axios.get(apiUrl, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        sha = data.sha;
      } catch {
        sha = undefined;
      }

      const encodedContent = Buffer.from(fileContent).toString("base64");

      await axios.put(apiUrl, {
        message: `Ajout automatique de ${fileName}`,
        content: encodedContent,
        branch: BRANCH,
        sha
      }, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      return message.reply(`Commande \`${fileName}\` enregistrée sur GitHub dans \`scripts/cmds/\`.`);

    } catch (error) {
      console.error("Erreur GitHub:", error.response?.data || error.message);
      return message.reply(`Erreur GitHub : ${error.response?.data?.message || error.message}`);
    }
  },

  onStart(params) {
    return this.handleCommand(params);
  }
};