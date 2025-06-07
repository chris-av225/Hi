const fs = require("fs").promises;
const axios = require("axios");

module.exports.config = {
  name: "runmocky",
  aliases: ["run"],
  version: "1.0.1",
  role: 2,
  author: "Team Calyx",
  category: "convert",
  guide: { en: "{p}run <fileName> or reply code" },
  countDown: 3,
};

module.exports.onStart = async function ({ api, event, args }) {
  const fileName = args[0];
  let code = null;
  if (event.type === "message_reply") {
    code = event.messageReply.body;
  } else if (!fileName) {
    api.sendMessage("Please specify the filename or reply with code.", event.threadID, event.messageID);
    return;
  }

  if (!code) {
    const filePath = `scripts/cmds/${fileName}.js`;
    try {
      code = await fs.readFile(filePath, "utf-8");
    } catch (error) {
      if (error.code === "ENOENT") {
        api.sendMessage("File not found. Please ensure the file exists in the `scripts/cmds/` directory.", event.threadID, event.messageID);
      } else {
        api.sendMessage("Error occurred while processing the command.", event.threadID, event.messageID);
      }
      return;
    }
  }

  const mockyUrl = "https://api.mocky.io/api/mock";
  const requestData = {
    status: 200,
    content: code,
    content_type: "application/json",
    charset: "UTF-8",
    secret: "ULYqac30bH07pa8r7u3eAK7dPwAW9Nc0uR7G",
    expiration: "never",
  };

  try {
    const response = await axios.post(mockyUrl, requestData, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.data && response.data.link) {
      const runmockyLink = response.data.link;
      api.sendMessage(runmockyLink, event.threadID, event.messageID);
    } else {
      throw new Error("API response does not contain the expected link.");
    }
  } catch (error) {
    api.sendMessage("Error occurred while processing the command.", event.threadID, event.messageID);
  }
};
