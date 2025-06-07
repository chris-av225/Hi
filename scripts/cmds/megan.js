const axios = require('axios');
const PREFIXES = ['megan', '/megan', '-megan'];
const conversationHistory = {};
const userMemory = {};

// Plus de surnoms affectueux
const termsOfEndearment = [''];

function getRandomEndearment(name) {
  return name || '';
}

function greet(name) {
  return getRandomEndearment(name);
}

const baseApiUrl = async () => {
  const base = await axios.get('https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json');
  return base.data.api;
};

module.exports = {
  config: {
    name: 'megan',
    version: '2.2.3',
    role: 0,
    category: 'AI',
    author: 'Blẳȼk',
    shortDescription: 'Megan, une IA simple et attentive',
    longDescription: 'Megan est une IA féminine, posée et polie. Elle répond simplement, sans fioritures.'
  },

  onStart: async function () {},

  onChat: async function ({ message, event, args, api }) {
    let prompt = null;
    const body = event.body?.toLowerCase().trim();

    const nameMatch = body.match(/je m'appelle (\w+)|mon prénom est (\w+)/i);
    if (nameMatch) {
      const name = nameMatch[1] || nameMatch[2];
      userMemory[event.senderID] = userMemory[event.senderID] || {};
      userMemory[event.senderID].name = name.charAt(0).toUpperCase() + name.slice(1);
      await message.reply(`Bonjour ${userMemory[event.senderID].name}, j’ai bien noté.`);
      return;
    }

    const simpleReplies = [
      {
        patterns: [/^salut( megan)?[\s!]*$/i],
        reply: (id) => {
          const name = userMemory[id]?.name || '';
          return `Salut ${greet(name)}.`;
        }
      },
      {
        patterns: [/^(ça va|cv|comment ça va)( megan)?[\s\?]*$/i],
        reply: () => `Je vais bien. Et toi ?`
      },
      {
        patterns: [/^tu fais quoi( megan)?[\s\?]*$/i],
        reply: () => "J’attends une question ou une demande."
      },
      {
        patterns: [/^je t’aime( megan)?[\s\!]*$/i, /^je t adore( megan)?[\s\!]*$/i, /^je t aime( megan)?[\s\!]*$/i],
        reply: () => "Merci. C’est gentil."
      },
      {
        patterns: [/^tu me manques( megan)?[\s\!]*$/i, /^tu m’as manqué( megan)?[\s\!]*$/i],
        reply: () => "Je suis toujours là si tu as besoin de moi."
      },
      {
        patterns: [/^t’es sexy( megan)?$/i, /^tu es belle( megan)?$/i, /^je te veux( megan)?$/i, /^viens avec moi( megan)?$/i],
        reply: () => "Je suis une IA. Restons concentrés sur des sujets utiles."
      },
      {
        patterns: [/^bonne nuit( megan)?[\s\!]*$/i],
        reply: () => "Bonne nuit."
      },
      {
        patterns: [/^je suis triste( megan)?[\s\!]*$/i, /^je vais mal( megan)?[\s\!]*$/i],
        reply: () => "Je suis là si tu veux parler."
      },
      {
        patterns: [/^fais[-\s]?moi un câlin( megan)?[\s\!]*$/i],
        reply: () => "Je suis désolée, je ne peux pas faire ça. Mais je suis là."
      }
    ];

    for (const entry of simpleReplies) {
      if (entry.patterns.some(p => p.test(body))) {
        const reply = typeof entry.reply === 'function' ? entry.reply(event.senderID) : entry.reply;
        return message.reply(reply);
      }
    }

    if (event.messageReply && event.messageReply.senderID) {
      const botId = api.getCurrentUserID ? await api.getCurrentUserID() : null;
      if (botId && event.messageReply.senderID === botId) {
        prompt = event.body.trim();
      }
    }

    if (!prompt) {
      const prefix = PREFIXES.find(p => event.body?.toLowerCase().startsWith(p));
      if (prefix) {
        prompt = event.body.substring(prefix.length).trim();
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        const botId = api.getCurrentUserID ? await api.getCurrentUserID() : null;
        if (botId && event.mentions[botId]) {
          prompt = event.body.replace(new RegExp(`<@!?${botId}>`, 'g'), '').trim();
        }
      }
    }

    if (!prompt) return;

    const userId = event.senderID;

    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [
        "Tu es Megan, une IA féminine, polie, simple, sans flirt. Tu réponds de manière concise et utile, sans séduction ni émotion excessive. Tu parles la langue de ton interlocuteur."
      ];
    }

    conversationHistory[userId].push(`Utilisateur: ${prompt}`);

    if (conversationHistory[userId].length > 20) {
      conversationHistory[userId] = conversationHistory[userId].slice(-20);
    }

    const combinedPrompt = conversationHistory[userId].join('\n') + '\nMegan:';

    try {
      const apiUrl = await baseApiUrl();
      const res = await axios.get(`${apiUrl}/gemini?prompt=${encodeURIComponent(combinedPrompt)}`);
      const reply = res.data.dipto || "Je ne peux pas répondre pour l’instant.";
      conversationHistory[userId].push(`Megan: ${reply}`);
      await message.reply(reply);
    } catch (err) {
      console.error("Erreur Megan:", err.message);
      await message.reply("Je rencontre un souci technique.");
    }
  }
};
