module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "cmd"],
    version: "1.0",
    author: "Blẳȼk",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Show available commands"
    },
    longDescription: {
      en: "Display a list of all commands grouped by category"
    },
    category: "info",
    guide: {
      en: "{pn} - Show all available commands"
    }
  },

  onStart: async function ({ message, args, commandName, prefix }) {
    const allCommands = global.GoatBot.commands;
    const commandsByCategory = {};
    let total = 0;

    for (const [name, cmd] of allCommands) {
      const category = (cmd.config.category || "Other").toUpperCase();
      if (!commandsByCategory[category]) commandsByCategory[category] = [];
      commandsByCategory[category].push(`│ ⦿➢ ${name}`);
      total++;
    }

    let text = `
╔═════✧✿♛✿✧═════╗
║🐥 𝗠𝗘𝗖𝗛𝗔⚡𝗔𝗜•𝗕𝗢𝗧 🐣║
╠════════════════╣
║  ⌬ *𝐋𝐈𝐒𝐓 𝐃𝐄𝐒 𝐂𝐌𝐃* ⌬   ║`;

    for (const [cat, cmds] of Object.entries(commandsByCategory)) {
      text += `\n╠╌╌〔 ${cat} 〕\n${cmds.sort().join("\n")}`;
    }

    text += `
╠════════════════╣
║ ⌬ Nombre total : ${total} commandes
║ ⌬ Tape : ${prefix}help <cmd> pour plus d’infos
╠════════════════╣
║🐥 𝗠𝗘𝗖𝗛𝗔⚡𝗔𝗜•𝗕𝗢𝗧 🐣║
╚═════✧❀♛❀✧═════╝`;

    message.reply(text);
  }
};
