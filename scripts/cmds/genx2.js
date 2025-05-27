const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

const cacheImages = new Map();

module.exports = {
  config: {
    name: "genx2",
    aliases: [],
    version: "1.8",
    author: "Vex_Kshitiz & Blẳȼk",
    countDown: 10, // délai entre chaque utilisation en secondes
    role: 1, // Seulement les admins du bot peuvent utiliser
    longDescription: {
      vi: "",
      en: "Generate 4 images with various styles, qualities, formats and choose one"
    },
    category: "IMAGE",
    guide: {
      vi: "",
      en: "{pn} <prompt> [format]"
    }
  },

  onStart: async function ({ api, event, args, message, waitForReply }) {
    try {
      // Gestion aide -h
      if (args[0] === "-h") {
        const helpMsg = `
✨ **Styles reconnus et exemples d’utilisation** :

───────────────────
🖌 Anime / Manga  
Prompt exemple : "guerrière elfe, anime, dynamique, vibrant"  
=> Images style animation japonaise, couleurs vives, traits nets.

───────────────────
📷 Realistic / Photorealistic  
Prompt exemple : "portrait femme, realistic, 8k, lumière naturelle"  
=> Portrait humain ultra réaliste, textures peau très détaillées.

───────────────────
🎨 Digital Art / Painting  
Prompt exemple : "paysage fantastique, digital art, brush strokes"  
=> Style peinture digitale, coups de pinceaux visibles.

───────────────────
🖼 Concept Art  
Prompt exemple : "ville futuriste, concept art, ambiance cinématique"  
=> Atmosphère dramatique, style croquis artistique.

───────────────────
🌌 Fantasy  
Prompt exemple : "magicienne, fantasy, éléments magiques, épique"  
=> Thème magique, scènes épiques et féeriques.

───────────────────
🌆 Cyberpunk  
Prompt exemple : "héros, cyberpunk, néons, ville futuriste sombre"  
=> Ambiance urbaine futuriste, lumières néons, sombre.

───────────────────
🎞 3D Render  
Prompt exemple : "voiture sportive, 3d, rendu réaliste, profondeur"  
=> Images 3D photoréalistes, profondeur et textures détaillées.

───────────────────
Pour plus d'infos, utilisez \`genx2 -f\` pour voir les formats disponibles.
        `;
        return message.reply(helpMsg.trim());
      }

      // Gestion formats -f
      if (args[0] === "-f") {
        const formats = {
          "1": { ratio: "1:1", emoji: "◼️", desc: "Carré, parfait pour portraits ou avatars." },
          "2": { ratio: "16:9", emoji: "📺", desc: "Rectangulaire large, format plein écran." },
          "3": { ratio: "9:16", emoji: "📱", desc: "Portrait vertical, idéal pour mobiles." },
          "4": { ratio: "4:3", emoji: "🖼️", desc: "Classique format photo." },
          "5": { ratio: "2:1", emoji: "🏞️", desc: "Panorama large." },
          "6": { ratio: "3:4", emoji: "📐", desc: "Portrait un peu plus grand que 9:16." },
          "7": { ratio: "21:9", emoji: "🎬", desc: "Cinémascope, très large et cinématique." }
        };
        let helpMsg = "📐 Formats disponibles pour genx2:\n\n";
        for (const key in formats) {
          helpMsg += `${formats[key].emoji}  ${key}. Ratio ${formats[key].ratio} : ${formats[key].desc}\n\n`;
        }
        return message.reply(helpMsg.trim());
      }

      // Vérification admin (role=1) - supposée gérée ailleurs

      // Extraire format si spécifié en dernier argument
      const formatsValues = {
        "1:1": true,
        "16:9": true,
        "9:16": true,
        "4:3": true,
        "2:1": true,
        "3:4": true,
        "21:9": true
      };

      let formatRatio = "1:1"; // Par défaut carré
      if (args.length > 1) {
        const lastArg = args[args.length - 1];
        if (formatsValues[lastArg]) {
          formatRatio = lastArg;
          args.pop();
        }
      }

      const promptRaw = args.join(" ").trim();
      if (!promptRaw) return message.reply("❌ Veuillez fournir un prompt pour générer les images.");

      // Enrichir le prompt selon styles / qualité plus précis
      const enrichPromptWithStyle = (prompt) => {
        let enriched = prompt.toLowerCase();

        // Styles selon help
        if (enriched.includes("anime") || enriched.includes("manga"))
          enriched += ", anime style, vibrant colors, detailed lines";
        else if (enriched.includes("realistic") || enriched.includes("photorealistic") || enriched.includes("réaliste"))
          enriched += ", ultra realistic, photorealistic, 8k resolution, detailed skin textures";
        else if (enriched.includes("digital art") || enriched.includes("painting") || enriched.includes("paint"))
          enriched += ", digital art style, visible brush strokes, painterly";
        else if (enriched.includes("concept art"))
          enriched += ", concept art style, cinematic atmosphere, dramatic lighting";
        else if (enriched.includes("fantasy"))
          enriched += ", fantasy theme, magical elements, epic scenes";
        else if (enriched.includes("cyberpunk"))
          enriched += ", cyberpunk, neon lights, futuristic city, dark mood";
        else if (enriched.includes("3d") || enriched.includes("3d render"))
          enriched += ", 3d render, realistic lighting, sharp details";

        if (enriched.includes("hd") || enriched.includes("high quality") || enriched.includes("4k") || enriched.includes("8k"))
          enriched += ", extremely detailed, ultra high resolution";

        return enriched;
      };

      const prompt = enrichPromptWithStyle(promptRaw);

      // Envoi message génération en cours
      await message.reply("♻️ Génération des images en cours...");

      // Réaction démarrage génération
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // Génération des 4 images
      const imageUrls = [];
      for (let i = 0; i < 4; i++) {
        const response = await axios.get(`https://dall-e-tau-steel.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(formatRatio)}`);
        imageUrls.push(response.data.response);
      }

      // Téléchargement des images
      const attachments = [];
      for (let i = 0; i < 4; i++) {
        const imgResponse = await axios.get(imageUrls[i], { responseType: "arraybuffer" });
        const imgPath = path.join(__dirname, "cache", `dalle_image_${i}.jpg`);
        await fs.outputFile(imgPath, imgResponse.data);
        attachments.push(fs.createReadStream(imgPath));
      }

      // Envoi des images
      await api.sendMessage({
        body: "✅ Voici 4 images générées selon votre prompt.",
        attachment: attachments
      }, event.threadID, event.messageID);

      // Message succès génération
      await message.reply("✅ Image générée avec succès !");

      cacheImages.set(event.threadID + event.senderID, imageUrls);

      // Attendre la réponse (1,2,3,4)
      const reply = await waitForReply({
        threadID: event.threadID,
        senderID: event.senderID,
        time: 10000 // délai d'attente 10 secondes
      });

      const choix = reply?.body?.trim();
      if (!reply || !["1", "2", "3", "4"].includes(choix)) {
        return message.reply("⏱️ Aucune image sélectionnée ou réponse invalide.");
      }

      const urlChoisie = cacheImages.get(event.threadID + event.senderID)[parseInt(choix) - 1];
      if (!urlChoisie) return message.reply("❌ Image introuvable.");

      const finalResponse = await axios.get(urlChoisie, { responseType: "arraybuffer" });
      const finalPath = path.join(__dirname, "cache", `dalle_image_final_${event.threadID}_${event.senderID}.jpg`);
      await fs.outputFile(finalPath, finalResponse.data);

      await api.sendMessage({ body: `✅ Voici l'image numéro ${choix} que vous avez choisie :`, attachment: fs.createReadStream(finalPath) }, event.threadID);

      cacheImages.delete(event.threadID + event.senderID);

      // Réaction fin
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error("Erreur :", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Une erreur est survenue pendant la génération.");
    }
  }
};