module.exports = {
  config: {
    name: "antichangeinfobox",
    version: "1.0",
    author: "ChatGPT",
    description: "Empêche les modifications non autorisées du groupe et détecte les spams.",
    category: "group",
    usages: "[on/off]",
    cooldowns: 3
  },

  onStart: async function ({ api, args, event, threads }) {
    const threadID = event.threadID;
    const status = args[0];

    if (!["on", "off"].includes(status)) {
      return api.sendMessage("Utilisation : antichangeinfobox on / off", threadID);
    }

    const data = await threads.getData(threadID) || {};
    data.antichangeinfobox = status === "on";
    await threads.setData(threadID, data);

    return api.sendMessage(
      `Fonction anti-changements & anti-spam ${status === "on" ? "activée" : "désactivée"} !`,
      threadID
    );
  },

  onChat: async function ({ api, event, threads, users }) {
    const { threadID, senderID, body, isGroup } = event;
    if (!isGroup) return;

    const data = await threads.getData(threadID);
    if (!data.antichangeinfobox) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const senderInfo = await users.getData(senderID);
    const isAdmin = threadInfo.adminIDs.some(e => e.id === senderID);

    // Anti-SPAM : 3 messages identiques en 5s
    if (!global.spamProtect) global.spamProtect = {};
    if (!global.spamProtect[threadID]) global.spamProtect[threadID] = {};

    const now = Date.now();
    const userData = global.spamProtect[threadID][senderID] || { last: "", times: [], banned: false };

    if (userData.last === body) {
      userData.times.push(now);
      userData.times = userData.times.filter(t => now - t < 5000);
    } else {
      userData.last = body;
      userData.times = [now];
    }

    if (userData.times.length >= 3 && !isAdmin && !userData.banned) {
      userData.banned = true;
      await api.removeUserFromGroup(senderID, threadID);
      api.sendMessage(`${senderInfo.name} a été expulsé pour spam.`, threadID);
    }

    global.spamProtect[threadID][senderID] = userData;
  },

  onEvent: async function ({ api, event, threads }) {
    const { threadID, logMessageType, logMessageData } = event;
    const data = await threads.getData(threadID);
    if (!data.antichangeinfobox) return;

    // Types d'événements surveillés
    const forbiddenChanges = ["log:thread-name", "log:thread-icon", "log:thread-color", "log:thread-image"];
    if (!forbiddenChanges.includes(logMessageType)) return;

    const actorID = event.author;
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(e => e.id === actorID);

    if (isAdmin) return;

    // Compteur d'infractions
    if (!data.editCount) data.editCount = {};
    if (!data.editCount[actorID]) data.editCount[actorID] = 1;
    else data.editCount[actorID] += 1;

    // Restaurer les infos de base (si besoin, stocke-les manuellement)
    if (logMessageType === "log:thread-name") {
      await api.setTitle(data.originalName || "Nom protégé", threadID);
    }
    if (logMessageType === "log:thread-icon") {
      await api.changeThreadEmoji(data.originalEmoji || "👍", threadID);
    }
    if (logMessageType === "log:thread-color") {
      await api.changeThreadColor(data.originalColor || "1000000", threadID);
    }

    api.sendMessage(
      `⚠️ ${actorID} a modifié les infos du groupe sans autorisation. Infraction ${data.editCount[actorID]}/3.`,
      threadID
    );

    if (data.editCount[actorID] >= 3) {
      await api.removeUserFromGroup(actorID, threadID);
      api.sendMessage(`${actorID} a été banni après 3 modifications interdites.`, threadID);
      data.editCount[actorID] = 0;
    }

    await threads.setData(threadID, data);
  }
};
