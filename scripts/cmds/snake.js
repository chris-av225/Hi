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

const COLORS = {
    "🟢🟩": { head: "🟢", body: "🟩" },
    "🔵🟦": { head: "🔵", body: "🟦" },
    "🔵🟦": { head: "🔵", body: "🟦" }, // IA (bleu au lieu de blanc)
    "🔴🟥": { head: "🔴", body: "🟥" },
    "🟠🟧": { head: "🟠", body: "🟧" },
    "🟡🟨": { head: "🟡", body: "🟨" },
    "🟣🟪": { head: "🟣", body: "🟪" },
    "🟤🟫": { head: "🟤", body: "🟫" }
};

module.exports = {
    config: {
        name: "snake",
        version: "1.5",
        author: "Blẳȼk",
        description: "Jeu Snake multijoueur avec IA, choix de couleur et classement",
        category: "game",
        usage: "<@joueur2 | ID | IA>",
        cooldown: 5
    },

    onStart: async function ({ message, event, args, usersData }) {
        const player1 = event.senderID;
        let player2 = null;

        if (Object.keys(event.mentions).length > 0) {
            player2 = Object.keys(event.mentions)[0];
        } else if (args[0]) {
            if (args[0].toLowerCase() === "ia") player2 = "IA";
            else player2 = args[0].replace(/[^0-9]/g, "");
        }

        if (!player2) return message.reply("❗ Mentionnez un joueur ou tapez IA pour jouer contre l'intelligence artificielle.");
        if (player1 === player2) return message.reply("❌ Vous ne pouvez pas jouer contre vous-même.");

        const id = `${player1}_${player2}`;
        if (snakeGames[id]) return message.reply("⚠️ Une partie est déjà en cours entre vous deux.");

        // Démarre la sélection des couleurs
        snakeGames[id] = {
            state: "choosingColors",
            players: [player1, player2],
            colorChoice: {},
            message
        };

        let prompt = "🎨 Choisissez chacun une couleur parmi celles-ci :\n\n";
        prompt += Object.keys(COLORS).filter(c => c !== "🔵🟦").join("  ") + "\n\n";
        prompt += "Répondez simplement par la couleur (ex: 🟢🟩) pour choisir votre serpent.\n";
        prompt += `${player2 === "IA" ? "Toi" : "Les deux joueurs"}, choisis(sez) votre couleur.`;

        message.reply(prompt);
    },

    onChat: async function ({ event, message, usersData }) {
        const userId = event.senderID;
        const input = event.body.trim();
        const id = Object.keys(snakeGames).find(key => key.includes(userId));
        if (!id) return;

        const game = snakeGames[id];

        if (game.state === "choosingColors") {
            if (!Object.keys(COLORS).includes(input)) return;
            if (Object.values(game.colorChoice).includes(input)) return message.reply("❗ Cette couleur a déjà été choisie. Choisis une autre.");

            const player1 = game.players[0];
            const player2 = game.players[1];

            game.colorChoice[userId] = input;

            if (player2 === "IA") {
                game.colorChoice["IA"] = "🔵🟦";
                if (game.colorChoice[player1]) {
                    startGame(id, message, usersData);
                }
            } else {
                if (game.colorChoice[player1] && game.colorChoice[player2]) {
                    startGame(id, message, usersData);
                }
            }
        } else {
            handleGameMove(id, event, message, usersData);
        }
    }
};

function startGame(id, message, usersData) {
    const game = snakeGames[id];
    game.state = "playing";

    const [player1, player2] = game.players;
    const grid = Array(8).fill(null).map(() => Array(8).fill("⬛"));
    const snake1 = [{ x: 0, y: 1 }];
    const snake2 = [{ x: 7, y: 6 }];
    const apple = spawnApple(grid, [...snake1, ...snake2]);

    const color1 = COLORS[game.colorChoice[player1]];
    const color2 = player2 === "IA" ? COLORS["🔵🟦"] : COLORS[game.colorChoice[player2]];

    grid[1][0] = color1.head;
    grid[6][7] = color2.head;
    grid[apple.y][apple.x] = "🍎";

    Object.assign(game, {
        grid,
        snakes: { [player1]: snake1, [player2]: snake2 },
        apple,
        turn: player2,
        scores: { [player1]: 0, [player2]: 0 },
        colors: { [player1]: color1, [player2]: color2 }
    });

    Promise.all([
        usersData.getName(player1),
        player2 === "IA" ? "IA" : usersData.getName(player2)
    ]).then(([name1, name2]) => {
        message.reply(renderGrid(grid, game.scores, name1, name2, name2));
        if (player2 === "IA") aiPlay(id, message, usersData);
    });
}

function handleGameMove(id, event, message, usersData) {
    const game = snakeGames[id];
    const direction = event.body.toLowerCase();
    const directions = {
        haut: { x: 0, y: -1 },
        bas: { x: 0, y: 1 },
        gauche: { x: -1, y: 0 },
        droite: { x: 1, y: 0 }
    };

    if (!directions[direction]) return;

    if (event.senderID !== game.turn) {
        return usersData.getName(event.senderID).then(name => message.reply(`❌ ${name}, ce n'est pas ton tour !`));
    }

    const delta = directions[direction];
    const snake = game.snakes[event.senderID];
    const head = snake[0];
    const newHead = { x: head.x + delta.x, y: head.y + delta.y };

    const opponent = game.players.find(p => p !== event.senderID);
    const isCollision = (
        newHead.x < 0 || newHead.y < 0 ||
        newHead.x > 7 || newHead.y > 7 ||
        game.snakes[event.senderID].some(p => p.x === newHead.x && p.y === newHead.y)
    );

    if (isCollision) {
        Promise.all([
            usersData.getName(event.senderID),
            opponent === "IA" ? "IA" : usersData.getName(opponent)
        ]).then(([loser, winner]) => {
            winData[opponent] = (winData[opponent] || 0) + 1;
            fs.writeFileSync(winsFile, JSON.stringify(winData, null, 2));

            message.reply(`${loser} s'est écrasé ! ${winner} gagne ! �\n\n${renderGrid(game.grid, game.scores, loser, winner)}`);
            delete snakeGames[id];
        });
        return;
    }

    // Vérifier si un joueur a atteint 10 pommes
    if (game.scores[event.senderID] >= 9) { // 9 car on va l'incrémenter juste après
        game.scores[event.senderID]++;
        const winner = event.senderID;
        const loser = opponent;
        
        Promise.all([
            usersData.getName(winner),
            loser === "IA" ? "IA" : usersData.getName(loser)
        ]).then(([winnerName, loserName]) => {
            winData[winner] = (winData[winner] || 0) + 1;
            fs.writeFileSync(winsFile, JSON.stringify(winData, null, 2));
            
            message.reply(`🎉 ${winnerName} a atteint 10 pommes en premier et remporte la partie !\n\nScore final: ${winnerName} ${game.scores[winner]} - ${loserName} ${game.scores[loser]}`);
            delete snakeGames[id];
        });
        return;
    }

    // Nouvelle logique: si un serpent mange l'autre
    const otherSnake = game.snakes[opponent];
    const headCollision = otherSnake.some(p => p.x === newHead.x && p.y === newHead.y);
    
    if (headCollision) {
        // Le joueur actuel gagne 1 point
        game.scores[event.senderID]++;
        
        // L'adversaire perd 1 point et est réduit
        game.scores[opponent] = Math.max(0, game.scores[opponent] - 1);
        
        // Réduire le corps de l'adversaire de 1 segment (minimum 1)
        if (otherSnake.length > 1) {
            otherSnake.pop();
        }
        
        // Remettre l'adversaire au départ
        const startPos = opponent === game.players[0] ? { x: 0, y: 1 } : { x: 7, y: 6 };
        game.snakes[opponent] = [startPos];
    }

    const ateApple = newHead.x === game.apple.x && newHead.y === game.apple.y;
    snake.unshift(newHead);
    if (!ateApple) snake.pop();
    else {
        game.scores[event.senderID]++;
        game.apple = spawnApple(game.grid, [...game.snakes[game.players[0]], ...game.snakes[game.players[1]]]);
    }

    // Mise à jour de la grille
    game.grid = Array(8).fill(null).map(() => Array(8).fill("⬛"));
    
    // Dessiner le serpent 1
    for (const p of game.snakes[game.players[0]]) {
        game.grid[p.y][p.x] = game.players[0] === "IA" ? "🔵" : game.colors[game.players[0]].body;
    }
    game.grid[game.snakes[game.players[0]][0].y][game.snakes[game.players[0]][0].x] = game.colors[game.players[0]].head;
    
    // Dessiner le serpent 2
    for (const p of game.snakes[game.players[1]]) {
        game.grid[p.y][p.x] = game.players[1] === "IA" ? "🟦" : game.colors[game.players[1]].body;
    }
    game.grid[game.snakes[game.players[1]][0].y][game.snakes[game.players[1]][0].x] = game.colors[game.players[1]].head;
    
    game.grid[game.apple.y][game.apple.x] = "🍎";
    game.turn = opponent;

    Promise.all([
        usersData.getName(game.players[0]),
        game.players[1] === "IA" ? "IA" : usersData.getName(game.players[1]),
        game.turn === "IA" ? "IA" : usersData.getName(game.turn)
    ]).then(([name1, name2, next]) => {
        message.reply(renderGrid(game.grid, game.scores, name1, name2, next));
        if (game.turn === "IA") aiPlay(id, message, usersData);
    });
}

function renderGrid(grid, scores, name1, name2, joueurActuel = "") {
    const top = "   A B C D E F G H\n";
    const middle = grid.map((row, i) => `${i + 1} ${row.join(" ")} ${i + 1}`).join("\n");
    const bottom = "   A B C D E F G H\n";
    const scoreLine = `Scores : ${name1} ${scores[Object.keys(scores)[0]]} - ${name2} ${scores[Object.keys(scores)[1]]}`;
    const prompt = joueurActuel ? `\n\n🎮 ${joueurActuel}, à toi ! (haut, bas, gauche ou droite) :` : "";
    return `${top}${middle}\n${bottom}\n${scoreLine}${prompt}`;
}

function spawnApple(grid, occupied) {
    let x, y;
    do {
        x = Math.floor(Math.random() * 8);
        y = Math.floor(Math.random() * 8);
    } while (occupied.some(p => p.x === x && p.y === y));
    return { x, y };
}

function aiPlay(gameId, message, usersData) {
    const game = snakeGames[gameId];
    if (!game || game.turn !== "IA") return;

    setTimeout(() => {
        const directions = {
            haut: { x: 0, y: -1 },
            bas: { x: 0, y: 1 },
            gauche: { x: -1, y: 0 },
            droite: { x: 1, y: 0 }
        };

        const head = game.snakes["IA"][0];
        const goal = game.apple;
        const gridSize = 8;

        const isBlocked = (x, y) => {
            if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return true;
            const occupied = [...game.snakes[game.players[0]], ...game.snakes["IA"]];
            return occupied.some(p => p.x === x && p.y === y);
        };

        const openSet = [{ x: head.x, y: head.y, path: [] }];
        const visited = new Set();
        const hash = (x, y) => `${x},${y}`;

        while (openSet.length) {
            const current = openSet.shift();
            if (current.x === goal.x && current.y === goal.y) {
                const dir = current.path[0];
                const fakeEvent = { senderID: "IA", body: dir };
                return module.exports.onChat({ event: fakeEvent, message, usersData });
            }

            visited.add(hash(current.x, current.y));
            for (const [dir, delta] of Object.entries(directions)) {
                const nx = current.x + delta.x;
                const ny = current.y + delta.y;
                if (visited.has(hash(nx, ny)) || isBlocked(nx, ny)) continue;
                openSet.push({ x: nx, y: ny, path: [...current.path, dir] });
            }
        }

        const safeMoves = Object.entries(directions).filter(([_, delta]) => {
            const nx = head.x + delta.x;
            const ny = head.y + delta.y;
            return !isBlocked(nx, ny);
        });

        const chosen = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        const fakeEvent = { senderID: "IA", body: chosen ? chosen[0] : "haut" };
        module.exports.onChat({ event: fakeEvent, message, usersData });

    }, 800);
}