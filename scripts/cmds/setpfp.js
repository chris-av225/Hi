const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "setpfp",
    version: "1.0",
    author: "Amado",
    role: 1, // admin du bot requis
    shortDescription: "Changer la photo de profil du groupe",
    longDescription: "Répond à une image pour la définir comme nouvelle photo du groupe.",
    category: "group",
    guide: {
      fr: "{pn} en réponse à une image"
    }
  },

  onStart: async function ({ event, api, message }) {
    const reply = event.messageReply;
    if (!reply || !reply.attachments || reply.attachments[0]?.type !== "photo")
      return message.reply("Réponds à une **image** pour changer la photo du groupe.");

    const imgUrl = reply.attachments[0].url;
    const filePath = path.join(__dirname, "cache", `pfp_${event.threadID}.jpg`);

    try {
      // Télécharger l’image
      const res = await axios.get(imgUrl, { responseType: "stream" });
      await fs.ensureDir(path.dirname(filePath));
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);
      await new Promise(resolve => writer.on("finish", resolve));

      // Modifier la photo de groupe
      await api.changeGroupImage(fs.createReadStream(filePath), event.threadID);
      message.reply("✅ Photo de profil du groupe mise à jour avec succès.");
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(err);
      message.reply("❌ Échec du changement de photo. Vérifie les permissions ou l’image.");
    }
  }
};