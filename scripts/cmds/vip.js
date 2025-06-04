//Attention, cette cmd n'est pas a partager car elle contiendras vos informations privé et sensibles. Et cette cmd seule ne fonctionnerait pas ailleurs car elle requiert des modifications nécessaires sur la configuration interne du bot

const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "vip",
        version: "2.0",
        author: "MarianCross",
        countDown: 5,
        role: 2, // Seuls les admins bot peuvent utiliser cette commande
        shortDescription: {
            en: "Gérer les membres VIP et les commandes VIP"
        },
        longDescription: {
            en: "Gérer les membres VIP et définir quelles commandes nécessitent un statut VIP"
        },
        category: "admin",
        guide: {
            en: "{p}vip add <uid> - Ajouter un membre VIP\n"
                + "{p}vip remove <uid> - Retirer un membre VIP\n"
                + "{p}vip list - Lister les membres VIP\n"
                + "{p}vip cmd add <nom_commande> - Rendre une commande VIP uniquement\n"
                + "{p}vip cmd remove <nom_commande> - Retirer le statut VIP d'une commande\n"
                + "{p}vip cmd list - Lister les commandes VIP\n"
                + "{p}vip on/off - Activer/désactiver le mode VIP global"
        }
    },

    langs: {
        en: {
            noAdmin: "Vous n'avez pas la permission d'effectuer cette action.",
            addSuccess: "Le membre a été ajouté à la liste VIP !",
            alreadyInVIP: "Le membre est déjà dans la liste VIP !",
            removeSuccess: "Le membre a été retiré de la liste VIP !",
            notInVIP: "Le membre n'est pas dans la liste VIP !",
            list: "Liste des membres VIP :\n%1",
            vipModeEnabled: "Le mode VIP a été activé ✅",
            vipModeDisabled: "Le mode VIP a été désactivé ✅",
            commandNotFound: "La commande '%1' n'existe pas !",
            commandAddedToVIP: "La commande '%1' a été ajoutée aux commandes VIP !",
            commandAlreadyVIP: "La commande '%1' est déjà une commande VIP !",
            commandRemovedFromVIP: "La commande '%1' a été retirée des commandes VIP !",
            commandNotVIP: "La commande '%1' n'est pas une commande VIP !",
            vipCommandsList: "Liste des commandes VIP :\n%1",
            invalidArgs: "Arguments invalides. Utilisez {p}help vip pour voir l'utilisation.",
            missingVIPPermission: "🔒 Cette commande est réservée aux membres VIP uniquement.",
            emptyVIPList: "Aucun membre VIP pour le moment.",
            emptyVIPCommandsList: "Aucune commande VIP pour le moment.",
            githubSuccess: "Modifications sauvegardées sur GitHub ✅",
            githubError: "Erreur lors de la sauvegarde GitHub : %1",
            invalidUserID: "L'ID utilisateur '%1' n'est pas valide !",
            userNotFound: "Utilisateur introuvable"
        }
    },

    async handleCommand({ args, message, event, usersData, getLang }) {
        // Config GitHub
        const GITHUB_TOKEN = "";//met le token de ton GitHub. A voir le lien dans la description du Bot
        const REPO_OWNER = "";//Ton nom d'utilisateur github
        const REPO_NAME = "";//le nom du répertoire de ton bot 
        const BRANCH = "main";
        const GITHUB_PATH = "scripts/cmds/vip.json";
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${GITHUB_PATH}`;

        // Chemin local vers le fichier vip.json
        const vipDataPath = path.join(__dirname, 'vip.json');
        const cmdsPath = path.join(__dirname);
        const { senderID } = event;

        // Vérifier si l'utilisateur est admin bot
        if (!global.GoatBot.config.adminBot.includes(senderID)) {
            return message.reply(getLang("noAdmin"));
        }

        // Fonction pour valider un ID utilisateur
        const validateUserID = (id) => {
            const numericId = typeof id === 'string' ? parseInt(id) : id;
            return !isNaN(numericId) && numericId > 0 && numericId.toString().length >= 10;
        };

        // Fonction pour normaliser l'ID utilisateur (toujours en string pour le stockage)
        const normalizeUserID = (id) => {
            const numericId = typeof id === 'string' ? parseInt(id) : id;
            return numericId.toString();
        };

        // Fonction pour charger les données VIP depuis GitHub ou local
        const loadVipData = async () => {
            try {
                // Essayer de charger depuis GitHub d'abord
                const { data } = await axios.get(apiUrl, {
                    headers: { Authorization: `token ${GITHUB_TOKEN}` }
                });
                const content = Buffer.from(data.content, 'base64').toString('utf8');
                return JSON.parse(content);
            } catch (error) {
                // Si pas sur GitHub, essayer local
                try {
                    if (fs.existsSync(vipDataPath)) {
                        const data = fs.readFileSync(vipDataPath, 'utf8');
                        return JSON.parse(data);
                    }
                } catch (localError) {
                    console.error("Erreur lecture locale:", localError);
                }
                // Données par défaut
                return {
                    members: [],
                    commands: [],
                    enabled: false
                };
            }
        };

        // Fonction pour sauvegarder sur GitHub et localement
        const saveVipData = async (vipData) => {
            const jsonContent = JSON.stringify(vipData, null, 2);

            // Sauvegarder localement d'abord
            try {
                fs.writeFileSync(vipDataPath, jsonContent);
            } catch (error) {
                console.error("Erreur sauvegarde locale:", error);
            }

            // Essayer de sauvegarder sur GitHub
            try {
                // Récupérer le SHA si le fichier existe sur GitHub
                let sha;
                try {
                    const { data } = await axios.get(apiUrl, {
                        headers: { Authorization: `token ${GITHUB_TOKEN}` }
                    });
                    sha = data.sha;
                } catch {
                    sha = undefined;
                }

                // Encoder le contenu en base64
                const encodedContent = Buffer.from(jsonContent).toString('base64');

                // Envoyer sur GitHub
                await axios.put(apiUrl, {
                    message: `Mise à jour automatique VIP - ${new Date().toISOString()}`,
                    content: encodedContent,
                    branch: BRANCH,
                    sha
                }, {
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`,
                        "Content-Type": "application/json"
                    }
                });

                return true;
            } catch (error) {
                console.error("Erreur GitHub:", error.response?.data || error.message);
                return false;
            }
        };

        // Fonction pour vérifier si une commande existe
        const commandExists = (cmdName) => {
            const cmdFile = path.join(cmdsPath, `${cmdName}.js`);
            return fs.existsSync(cmdFile);
        };

        // Charger les données VIP
        const vipData = await loadVipData();

        // Gestion des sous-commandes
        switch (args[0]?.toLowerCase()) {
            case 'on':
                vipData.enabled = true;
                const saveResult1 = await saveVipData(vipData);
                const response1 = getLang("vipModeEnabled");
                return message.reply(saveResult1 ? response1 + "\n" + getLang("githubSuccess") : response1 + "\n" + getLang("githubError", "Sauvegarde locale uniquement"));

            case 'off':
                vipData.enabled = false;
                const saveResult2 = await saveVipData(vipData);
                const response2 = getLang("vipModeDisabled");
                return message.reply(saveResult2 ? response2 + "\n" + getLang("githubSuccess") : response2 + "\n" + getLang("githubError", "Sauvegarde locale uniquement"));

            case 'add':
                if (!args[1]) return message.reply(getLang("invalidArgs"));

                const rawUserIdToAdd = args[1];
                if (!validateUserID(rawUserIdToAdd)) {
                    return message.reply(getLang("invalidUserID", rawUserIdToAdd));
                }

                const userIdToAdd = normalizeUserID(rawUserIdToAdd);
                if (!vipData.members.includes(userIdToAdd)) {
                    vipData.members.push(userIdToAdd);
                    const saveResult3 = await saveVipData(vipData);
                    const response3 = getLang("addSuccess");
                    return message.reply(saveResult3 ? response3 + "\n" + getLang("githubSuccess") : response3 + "\n" + getLang("githubError", "Sauvegarde locale uniquement"));
                } else {
                    return message.reply(getLang("alreadyInVIP"));
                }

            case 'remove':
                if (!args[1]) return message.reply(getLang("invalidArgs"));

                const rawUserIdToRemove = args[1];
                const userIdToRemove = normalizeUserID(rawUserIdToRemove);

                if (vipData.members.includes(userIdToRemove)) {
                    vipData.members = vipData.members.filter(id => id !== userIdToRemove);
                    const saveResult4 = await saveVipData(vipData);
                    const response4 = getLang("removeSuccess");
                    return message.reply(saveResult4 ? response4 + "\n" + getLang("githubSuccess") : response4 + "\n" + getLang("githubError", "Sauvegarde locale uniquement"));
                } else {
                    return message.reply(getLang("notInVIP"));
                }

            case 'list':
                if (vipData.members.length === 0) {
                    return message.reply(getLang("emptyVIPList"));
                }

                const vipList = await Promise.all(vipData.members.map(async id => {
                    try {
                        // Convertir l'ID string en number pour getName
                        const numericId = parseInt(id);
                        if (isNaN(numericId)) {
                            return `${id} - (ID invalide)`;
                        }

                        const name = await usersData.getName(numericId);
                        return `${id} - (${name || getLang("userNotFound")})`;
                    } catch (error) {
                        console.error(`Erreur récupération nom pour ID ${id}:`, error);
                        return `${id} - (${getLang("userNotFound")})`;
                    }
                }));

                return message.reply(getLang("list", vipList.join('\n')));

            case 'cmd':
                switch (args[1]?.toLowerCase()) {
                    case 'add':
                        if (!args[2]) return message.reply(getLang("invalidArgs"));
                        const cmdToAdd = args[2].toLowerCase().trim();

                        if (!commandExists(cmdToAdd)) {
                            return message.reply(getLang("commandNotFound", cmdToAdd));
                        }

                        if (!vipData.commands.includes(cmdToAdd)) {
                            vipData.commands.push(cmdToAdd);
                            const saveResult5 = await saveVipData(vipData);
                            const response5 = getLang("commandAddedToVIP", cmdToAdd);
                            return message.reply(saveResult5 ? response5 + "\n" + getLang("githubSuccess") : response5 + "\n" + getLang("githubError", "Sauvegarde locale uniquement"));
                        } else {
                            return message.reply(getLang("commandAlreadyVIP", cmdToAdd));
                        }

                    case 'remove':
                        if (!args[2]) return message.reply(getLang("invalidArgs"));
                        const cmdToRemove = args[2].toLowerCase().trim();

                        if (vipData.commands.includes(cmdToRemove)) {
                            vipData.commands = vipData.commands.filter(cmd => cmd !== cmdToRemove);
                            const saveResult6 = await saveVipData(vipData);
                            const response6 = getLang("commandRemovedFromVIP", cmdToRemove);
                            return message.reply(saveResult6 ? response6 + "\n" + getLang("githubSuccess") : response6 + "\n" + getLang("githubError", "Sauvegarde locale uniquement"));
                        } else {
                            return message.reply(getLang("commandNotVIP", cmdToRemove));
                        }

                    case 'list':
                        if (vipData.commands.length === 0) {
                            return message.reply(getLang("emptyVIPCommandsList"));
                        }
                        return message.reply(getLang("vipCommandsList", vipData.commands.join(', ')));

                    default:
                        return message.reply(getLang("invalidArgs"));
                }

            default:
                return message.reply(getLang("invalidArgs"));
        }
    },

    onStart(params) {
        return this.handleCommand(params);
    }
};

// Fonction utilitaire pour vérifier les permissions VIP
global.utils = global.utils || {};
global.utils.checkVIPPermission = function(commandName, userID) {
    const vipDataPath = path.join(__dirname, 'vip.json');

    try {
        if (!fs.existsSync(vipDataPath)) return true;

        const data = fs.readFileSync(vipDataPath, 'utf8');
        const vipData = JSON.parse(data);

        // Si le mode VIP n'est pas activé, autoriser
        if (!vipData.enabled) return true;

        // Si la commande n'est pas dans la liste VIP, autoriser
        if (!vipData.commands.includes(commandName.toLowerCase())) return true;

        // Normaliser l'ID utilisateur pour la comparaison
        const normalizedUserID = userID.toString();

        // Si l'utilisateur est VIP, autoriser
        if (vipData.members.includes(normalizedUserID)) return true;

        // Si l'utilisateur est admin bot, autoriser
        if (global.GoatBot.config.adminBot.includes(userID)) return true;

        return false;
    } catch (error) {
        console.error("Erreur checkVIPPermission:", error);
        // En cas d'erreur, autoriser par défaut
        return true;
    }
};