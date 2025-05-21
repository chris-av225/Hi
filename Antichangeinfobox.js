module.exports = {
  config: {
    name: "antichangeinfobox",
    version: "1.0",
    author: "ChatGPT",
    description: "Commande test anti modification infobox",
    category: "group",
    usages: "on/off",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args, threads }) {
    const threadID = event.threadID;
    const value = args[0];
    if (!["on", "off"].includes(value)) {
      return api.sendMessage("Utilisation : antichangeinfobox on / off", threadID);
    }

    const data = await threads.getData(threadID) || {};
    data.antichangeinfobox = value === "on";
    await threads.setData(threadID, data);

    return api.sendMessage(`Fonction antichangeinfobox ${value === "on" ? "activée" : "désactivée"}.`, threadID);
  },

  onEvent: async function ({ api, event, threads }) {
    const { threadID, author, logMessageType } = event;
    const data = await threads.getData(threadID);
    if (!data.antichangeinfobox) return;

    const forbidden = ["log:thread-name", "log:thread-icon", "log:thread-color", "log:thread-image"];
    if (!forbidden.includes(logMessageType)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(e => e.id === author);
    if (isAdmin) return;

    if (!data.editCount) data.editCount = {};
    if (!data.editCount[author]) data.editCount[author] = 1;
    else data.editCount[author]++;

    api.sendMessage(`⚠️ Modification non autorisée par ${author} (${data.editCount[author]}/3)`, threadID);

    if (data.editCount[author] >= 3) {
      await api.removeUserFromGroup(author, threadID);
      api.sendMessage(`${author} a été expulsé pour modifications abusives.`, threadID);
      data.editCount[author] = 0;
    }

    await threads.setData(threadID, data);
  }
};
