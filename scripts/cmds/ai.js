const axios = require('axios');
const moment = require('moment-timezone');
require('moment/locale/fr'); // Import locale française

const UPoLPrefix = ['edu', 'ai', 'il', 'bot', 'ask'];

const timezoneMap = {
  france: 'Europe/Paris',
  cameroun: 'Africa/Douala',
  algérie: 'Africa/Algiers',
  maroc: 'Africa/Casablanca',
  tunisie: 'Africa/Tunis',
  sénégal: 'Africa/Dakar',
  côte_d_ivoire: 'Africa/Abidjan',
  burkina_faso: 'Africa/Ouagadougou',
  mali: 'Africa/Bamako',
  niger: 'Africa/Niamey',
  tchad: 'Africa/Ndjamena',
  bénin: 'Africa/Porto-Novo',
  togo: 'Africa/Lome',
  ghana: 'Africa/Accra',
  nigéria: 'Africa/Lagos',
  afrique_du_sud: 'Africa/Johannesburg',
  égypte: 'Africa/Cairo',
  kenya: 'Africa/Nairobi',
  éthiopie: 'Africa/Addis_Ababa',
  rwanda: 'Africa/Kigali',
  tanzanie: 'Africa/Dar_es_Salaam',
  ouganda: 'Africa/Kampala',
  angola: 'Africa/Luanda',
  rdcongo: 'Africa/Kinshasa',
  congo: 'Africa/Brazzaville',
  gabon: 'Africa/Libreville',
  zambie: 'Africa/Lusaka',
  zimbabwe: 'Africa/Harare',
  botswana: 'Africa/Gaborone',
  namibie: 'Africa/Windhoek',
  madagascar: 'Indian/Antananarivo',
  maurice: 'Indian/Mauritius',
  // Ajoute ici d'autres pays si nécessaire
};

// Liste des pays masculins pour la préposition « au »
const paysMasculins = [
  'togo',
  'cameroun',
  'maroc',
  'mali',
  'niger',
  'tchad',
  'bénin',
  'ghana',
  'nigéria',
  'congo',
  'rdcongo',
  'burkina_faso',
  'zimbabwe',
  'botswana',
  'namibie',
  'angola',
  'zambie',
];

module.exports = {
  config: {
    name: 'ai',
    version: '1.3.0',
    role: 0,
    category: 'AI',
    author: 'Metoushela Walker',
    shortDescription: 'Réponds aux questions avec IA et gère la date/heure',
    longDescription: 'Utilise Gemini pour répondre aux questions. Si on demande l’heure ou la date, il utilise une API spéciale.',
  },

  onStart: async function () {},

  onChat: async function ({ message, event, args }) {
    const ahprefix = UPoLPrefix.find((p) => event.body && event.body.toLowerCase().startsWith(p));
    if (!ahprefix) return;

    const question = event.body.substring(ahprefix.length).trim().toLowerCase();
    if (!question) return message.reply('✨ 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗳\n━━━━━━━━━━━━━\nPose-moi ta question.');

    const isTimeQuestion = /(quel(le)? heure|date|année|mois|jour)/.test(question);

    if (isTimeQuestion) {
      let country = 'france';
      for (const key in timezoneMap) {
        if (question.includes(key)) {
          country = key;
          break;
        }
      }

      const timezone = timezoneMap[country] || 'Europe/Paris';

      // Forcer la locale française
      const now = moment().tz(timezone).locale('fr');

      const dateStr = now.format('dddd D MMMM YYYY'); // Ex : vendredi 6 juin 2025
      const timeStr = now.format('HH:mm:ss'); // Format 24h

      // Capitaliser correctement le nom du pays (1ère lettre majuscule, underscore remplacé)
      const countryNameFormatted = country
        .replace(/_/g, ' ')
        .replace(/^\p{L}/u, (c) => c.toUpperCase());

      // Choisir la bonne préposition : "au" ou "en"
      const preposition = paysMasculins.includes(country) ? 'au' : 'en';

      const reply = `✨ 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗳\n━━━━━━━━━━━━━\n📅 Nous sommes le ${dateStr}.\n🕒 Il est ${timeStr} ${preposition} ${countryNameFormatted}.`;
      return message.reply(reply);
    }

    const encodedPrompt = encodeURIComponent(args.join(' '));
    await message.reply('Je réfléchis...');

    try {
      const response = await axios.get(`https://sandipbaruwal.onrender.com/gemini?prompt=${encodedPrompt}`);
      const answer = response.data.answer || 'Je n’ai pas pu trouver de réponse.';
      return message.reply(`✨ 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗳\n━━━━━━━━━━━━━\n${answer}`);
    } catch (error) {
      return message.reply('Une erreur est survenue lors de la requête IA.');
    }
  },
};
