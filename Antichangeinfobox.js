module.exports = {
  config: {
    name: "antichangeinfobox",
    version: "2.0",
    author: "ChatGPT",
    description: "Empêche les membres non-admins de modifier l'infobox (nom, photo, thème, emoji, pseudo).",
    category: "group",
    usages: "on/off",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args, threads }) {
    const { threadID } = event;
    const option = args[0];
    if (!["on", "off"].includes(option)) {
      return api.sendMessage("Utilisation : antichangeinfobox on / off", threadID);
    }

    const data = await threads.getData(threadID) || {};
    data.antichangeinfobox = option === "on";
    if (option === "on") {
      const info = await api.getThreadInfo(threadID);
      data.savedInfo = {
        name: info.threadName,
        emoji: info.emoji,
        color: info.color,
        imageSrc: info.imageSrc
      };
    }

    await threads.setData(threadID, data);
    return api.sendMessage(`Protection infobox ${option === "on" ? "activée" : "désactivée"} avec succès.`, threadID);
  },

  onEvent: async function ({ api, event, threads }) {
    const { threadID, author, logMessageType, logMessageData } = event;
    const data = await threads.getData(threadID);
    if (!data?.antichangeinfobox || !data?.savedInfo) return;

    const info = await api.getThreadInfo(threadID);
    const isAdmin = info.adminIDs.some(e => e.id === author);
    if (isAdmin) return;

    const saved = data.savedInfo;

    switch (logMessageType) {
      case "log:thread-name":
        if (logMessageData?.name !== saved.name) {
          await api.setTitle(saved.name, threadID);
          api.sendMessage("Nom du groupe restauré.", threadID);
        }
        break;

      case "log:thread-icon":
        if (info.emoji !== saved.emoji) {
          await api.changeThreadEmoji(saved.emoji, threadID);
          api.sendMessage("Emoji du groupe restauré.", threadID);
        }
        break;

      case "log:thread-color":
        if (info.color !== saved.color) {
          await api.changeThreadColor(saved.color, threadID);
          api.sendMessage("Thème du groupe restauré.", threadID);
        }
        break;

      case "log:thread-image":
        if (saved.imageSrc) {
          await api.changeGroupImage(saved.imageSrc, threadID);
          api.sendMessage("Photo du groupe restaurée.", threadID);
        }
        break;

      case "log:user-nickname":
        if (logMessageData?.nickname && logMessageData?.participant_id === author) {
          await api.changeNickname("", threadID, author);
          api.sendMessage("Pseudo modifié par un non-admin annulé.", threadID);
        }
        break;
    }
  }
};
