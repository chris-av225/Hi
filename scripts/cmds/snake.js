const fs = require("fs");
const winsFile = __dirname + "/snake_wins.json";

const snakeGames = {};
let winData = {};

if (fs.existsSync(winsFile)) {
  try {
    winData = JSON.parse(fs.readFileSync(winsFile, "utf8"));
  } catch (e) {
    winData = {};
  }
}

module.exports = {
  config: {
    name: "snake",
    version: "1.2",
    author: "Blẳȼk",
    description: "Jeu Snake multijoueur avec classement",
    category: "game",
    usage: "<@joueur2 | ID>",
    cooldown: 5
  },

  onStart: async function ({ message, event, args, usersData }) {
    const player1 = event.senderID;

    let player2 = null;
    if (Object.keys(event.mentions).length > 0) {
      player2 = Object.keys(event.mentions)[0];
    } else if (args[0]) {
      player2 = args[0].replace(/[^0-9]/g, "");
    }

    if (!player2) return message.reply("❗ Mentionnez un ami ou donnez son ID pour commencer une partie de serpent !");
    if (player1 === player2) return message.reply("❌ Vous ne pouvez pas jouer contre vous-même.");

    const id = `${player1}_${player2}`;
    if (snakeGames[id]) return message.reply("⚠️ Une partie est déjà en cours entre vous deux.");

    const grid = Array(8).fill(null).map(() => Array(8).fill("⬛"));
    const snake1 = [{ x: 0, y: 1 }];
    const snake2 = [{ x: 7, y: 6 }];
    const apple = spawnApple(grid, [...snake1, ...snake2]);

    grid[1][0] = "🟩";
    grid[6][7] = "🟦";
    grid[apple.y][apple.x] = "🍎";

    snakeGames[id] = {
      grid,
      snakes: {
        [player1]: snake1,
        [player2]: snake2
      },
      apple,
      turn: player2,
      scores: {
        [player1]: 0,
        [player2]: 0
      },
      players: [player1, player2]
    };

    const name1 = await usersData.getName(player1) || "Joueur 1";
    const name2 = await usersData.getName(player2) || "Joueur 2";
    message.reply(renderGrid(grid, snakeGames[id].scores, name1, name2, name2));
  },

  onChat: async function ({ event, message, usersData }) {
    const id = Object.keys(snakeGames).find(k => k.includes(event.senderID));
    if (!id) return;

    const game = snakeGames[id];
    if (event.senderID !== game.turn) return;

    const direction = event.body.toLowerCase();
    if (!["haut", "bas", "gauche", "droite"].includes(direction)) return;

    const snake = game.snakes[event.senderID];
    const head = snake[0];
    const delta = {
      haut: { x: 0, y: -1 },
      bas: { x: 0, y: 1 },
      gauche: { x: -1, y: 0 },
      droite: { x: 1, y: 0 }
    }[direction];

    const newHead = { x: head.x + delta.x, y: head.y + delta.y };

    if (
      newHead.x < 0 || newHead.y < 0 ||
      newHead.x > 7 || newHead.y > 7 ||
      Object.values(game.snakes).some(s => s.some(p => p.x === newHead.x && p.y === newHead.y))
    ) {
      const loserName = await usersData.getName(event.senderID) || "Joueur";
      const winnerId = game.players.find(p => p !== event.senderID);
      const winnerName = await usersData.getName(winnerId) || "Adversaire";

      // Mise à jour des victoires
      winData[winnerId] = (winData[winnerId] || 0) + 1;
      fs.writeFileSync(winsFile, JSON.stringify(winData, null, 2));

      message.reply(`${loserName} s'est écrasé ! ${winnerName} gagne ! 🏆\n${winnerName} totalise maintenant ${winData[winnerId]} victoire(s) !\n\n` +
        renderGrid(game.grid, game.scores,
          await usersData.getName(game.players[0]) || "Joueur 1",
          await usersData.getName(game.players[1]) || "Joueur 2"));

      delete snakeGames[id];
      return;
    }

    const ateApple = newHead.x === game.apple.x && newHead.y === game.apple.y;
    snake.unshift(newHead);
    if (!ateApple) snake.pop();
    else {
      game.scores[event.senderID]++;
      game.apple = spawnApple(game.grid, [...game.snakes[game.players[0]], ...game.snakes[game.players[1]]]);
    }

    game.grid = Array(8).fill(null).map(() => Array(8).fill("⬛"));
    for (const p of game.snakes[game.players[0]]) game.grid[p.y][p.x] = "🟩";
    for (const p of game.snakes[game.players[1]]) game.grid[p.y][p.x] = "🟦";
    game.grid[game.apple.y][game.apple.x] = "🍎";

    game.turn = game.players.find(p => p !== event.senderID);
    const nextName = await usersData.getName(game.turn) || "Joueur";
    const name1 = await usersData.getName(game.players[0]) || "Joueur 1";
    const name2 = await usersData.getName(game.players[1]) || "Joueur 2";

    message.reply(renderGrid(game.grid, game.scores, name1, name2, nextName));
  }
};

function renderGrid(grid, scores, name1, name2, joueurActuel) {
  const top = "   A B C D E F G H\n";
  const middle = grid.map((row, i) => `${i + 1} ${row.join(" ")} ${i + 1}`).join("\n");
  const bottom = "   A B C D E F G H\n";
  const scoreLine = `Scores : ${name1} ${scores[Object.keys(scores)[0]]} - ${name2} ${scores[Object.keys(scores)[1]]}`;
  const prompt = `${joueurActuel}, à toi (haut, bas, gauche ou droite)`;
  return `${top}${middle}\n${bottom}\n${scoreLine}\n\n${prompt}`;
}

function spawnApple(grid, occupied) {
  let x, y;
  do {
    x = Math.floor(Math.random() * 8);
    y = Math.floor(Math.random() * 8);
  } while (occupied.some(p => p.x === x && p.y === y));
  return { x, y };
}