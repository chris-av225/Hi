module.exports = {
  name: "salut",
  execute(message) {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === 'salut') {
      message.reply("Salut comment allez vous ? Moi c'est Mécha. Que puis-je faire pour vous aider aujourd'hui ? 🐥⚡");
    }
  }
};
