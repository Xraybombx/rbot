"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const { Authflow } = require('prismarine-auth');

const path_1 = __importDefault(require("path"));
const fs = require('fs');

const axios = require("axios");
const bedrock = require('bedrock-protocol')
const chalk = require('chalk');
const { Client, Intents, MessageEmbed, MessageAttachment, } = require("discord.js");
const { realminvite, realmName, token, relaychannel, modlogschannel, clientId, guildId, botName, banneddevices, minimumgamerscore, ignoreps4andxbox, realmtodiscord, discordtorealm } = require("./config.json");
const {
    hasMentions,
    chkMsg,
    stringToColor,
    fancyHash,
    mcColor,
    pktrgx,
    ignorepackets,
    logpaknames,
    conceptArt,
    colormap
} = require('./utils')
const discordToken = token

function logOrIgnore(packetname) {
    try {
        if (logpaknames !== 1) { return }
        if (rtest(packetname) === true) { return }
        if (ignorepackets.includes(packetname)) { return }
        console.log("Recieved a", packetname, "packet.")
    } catch (e) { console.log(e) }
}
function rtest(t) {
    return !!pktrgx.exec(t)
}

function sanitizeString(str) {
    str = str.replace(/[^0-9]/gim, '');
    return str.trim()
}

class DiscBot {
    constructor() {
        this.connectionReady = false
        this.client = null
        this.discordClient = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
            ],
        });
        this.getRealmClient = function () {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const c = bedrock.createClient({ connectTimeout: 15000, realms: { realmInvite: realminvite } })
                        resolve(c)
                    } catch (e) { console.log(e); reject(e.message) }

                }, 3000)
            })
        }
        this.getRealmClient().then((c) => { this.client = c })
    }
    
    
    onStartup() {
        setTimeout(() => {

            //runs commands when bot joins
            setTimeout(() => {
                try {
                this.client.queue('command_request', { command: `gamemode c "${botName}"`, origin: { type: '0', uuid: '', request_id: '', }, })
                this.client.queue('command_request', { command: `tp "${botName}" 80000 0 80000`, origin: { type: '0', uuid: '', request_id: '', }, })
                this.client.queue('command_request', { command: `effect "${botName}" invisibility 1000000 255 true"`, origin: { type: '0', uuid: '', request_id: '', }, })
        }catch(err) {}
        }, 5000);
            
            
            var violationreason = `not specified`

            this.client.on("player_list", (packet) => {
                if(packet.records.type === "add") {

                    console.log(`player list packed has been recieved`)
                    //shows when a player is joining the realm
            packet.records.records.forEach(player => {
                if (player.username === botName) return;
                this.client.queue('command_request', { command: `tellraw @a {"rawtext":[{"text":"§7${player.username} is joining the realm..."}]}`, origin: { type: 'player', uuid: '', request_id: '', }, })
           
                    //ignores whitelisted players
                    fs.readFile(path_1.default.resolve(`./whitelisted.json`), 'utf8', async (err, data) => {
                     if (!data || err) return console.log(err);
                     if (data.includes(player.xbox_user_id)) return;

                    new Authflow('', `\\auth`, { relyingParty: 'http://xboxlive.com' }).getXboxToken().then(async (t) => {

                        try {
                            //gets players xuid
                            const { data } = await (0, axios_1.default)(`https://profile.xboxlive.com/users/gamertag(${player.username})/profile/settings?settings=Gamertag`, {
                                headers: { 'x-xbl-contract-version': '2', 'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`, "Accept-Language": "en-US" }
                            });
                            const Xuid = data.profileUsers[0].id;
    
                            //gets players gamerscore
                            var XboxGS = (await axios_1.default.get(`https://profile.xboxlive.com/users/gamertag(${player.username})/profile/settings?settings=Gamerscore`, {
                                headers: {
                                    'x-xbl-contract-version': '2',
                                    'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
                                    "Accept-Language": "en-US"
                                }
                            })).data.profileUsers[0].settings[0].value;
                            //gets players titlehistory
                            axios_1.default.get(`https://titlehub.xboxlive.com/users/Xuid(${player.xbox_user_id})/titles/titlehistory/decoration/scid,image,detail`, {
                                headers: {
                                    'x-xbl-contract-version': '2',
                                    'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
                                    "Accept-Language": "en-US"
                                }
                            }).then(async (res) => {
    
                                //private account
                                if(!res.data.titles[0]) {
                                    this.client.queue('command_request', { command: `kick "${player.username}" §c\n§l§⊳kicked by §5Blink Automod\n§6User: ${player.username}\nGamerscore: ${XboxGS}\nReason: §cPrivate Title History`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                    this.client.queue('command_request', { command: `tellraw @a {"rawtext":[{"text":"§c${player.username} was kicked for having private title history!"}]}`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                    violationreason = `private title history`
                                }
    
                                if(banneddevices.includes(res.data.titles[0].name.replace(new RegExp('Minecraft for ','g'),''))) {
                                this.client.queue('command_request', { command: `kick "${player.username}" §c\n§l§⊳kicked by §5Blink Automod\n§6User: ${player.username}\nGamerscore: ${XboxGS}\nReason: §c${res.data.titles[0].name.replace(new RegExp('Minecraft for ','g'),'')} is a blocked device`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                this.client.queue('command_request', { command: `tellraw @a {"rawtext":[{"text":"§c${player.username} was kicked for playing on ${res.data.titles[0].name.replace(new RegExp('Minecraft for ','g'),'')}!"}]}`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                violationreason = `${res.data.titles[0].name.replace(new RegExp('Minecraft for ','g'),'')} Is A Blocked Device`
                                }
    
                                //recently played a blocked device (Checks the last 12 hours)
                                res.data.titles.forEach(title => {
                                if(banneddevices.includes(title.name.replace(new RegExp('Minecraft for ','g'),''))) {
                                let timeplayed = title.titleHistory.lastTimePlayed
                                let hourplayed = timeplayed.substr(11, 2) - 5; let minuteplayed = timeplayed.substr(14, 2); let secondplayed = timeplayed.substr(17, 2); let dayplayed = timeplayed.substr(8, 2); 
    
                                const today = new Date();
                                let todayday = today.getDay() + -1; let todayhour = today.getHours(); let todayminute = today.getMinutes(); let todaysecond = today.getSeconds();
    
                                let thisday = todayday - dayplayed; let thishour = todayhour - hourplayed
                                let thisminute = todayminute - minuteplayed; let thissecond = todaysecond - secondplayed
    
                                if (thishour < 12) { 
                                     this.client.queue('command_request', { command: `kick "${player.username}" §c\n§l§⊳kicked by §5Blink Automod\n§6User: ${player.username}\nGamerscore: ${XboxGS}\nReason: §cRecently Played On A Blocked Device`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                     this.client.queue('command_request', { command: `tellraw @a {"rawtext":[{"text":"§c${player.username} was kicked for recently playing on a blocked device!"}]}`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                     if (`Is A Blocked Device`.includes(violationreason)) return; violationreason = `Recently Played On A Blocked Device`
                                }
                                //checks if on minecraft
                                if(!res.data.titles[0].name.includes(`Minecraft`)) {
                                    this.client.queue('command_request', { command: `kick "${player.username}" §c\n§l§⊳kicked by §5Blink Automod\n§6User: ${player.username}\nGamerscore: ${XboxGS}\nReason: TitleHistory Doesn't Match`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                     this.client.queue('command_request', { command: `tellraw @a {"rawtext":[{"text":"§c${player.username} was kicked for titlehistory not matching current game"}]}`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                     violationreason = `TitleHistory Doesnt Match Current Game`
                                }
                                //checks gamerscore limit
                                if(XboxGS < minimumgamerscore) {
                                    this.client.queue('command_request', { command: `kick "${player.username}" §c\n§l§⊳kicked by §5Blink Automod\n§6User: ${player.username}\nGamerscore: ${XboxGS}\nReason: §cMust Have ${minimumgamerscore} Gamerscore To Join`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                     this.client.queue('command_request', { command: `tellraw @a {"rawtext":[{"text":"§c${player.username} was kicked for not meeting the minimum gamerscore requirement!"}]}`, origin: { type: 'player', uuid: '', request_id: '', }, })
                                     violationreason = `Needs ${minimumgamerscore - XboxGS} More Gamerscore To Play`
                                }
                                //automod logs
    
                                if(!`not specified`.includes(violationreason)) {
                                const modlogs = new MessageEmbed()
                                .setTitle(`__${realmName}__`)
                                .setDescription(`**User:** ${player.username}\n**Xuid:** ${Xuid}\n**Device:** ${res.data.titles[0].name.replace(new RegExp('Minecraft for ','g'),'')}\n**Gamerscore:** ${XboxGS}\n**Reason:** *${violationreason}*`)
                                .setFooter(``, `https://ucarecdn.com/5c54deeb-3c4e-4bbe-a6dd-cc64fc2b04ff/Temp1080x1080removebg.png`)
                                .setTimestamp()
                                .setColor(`#7e43e7`)
                                this.discordClient.channels.fetch(modlogschannel).then(async (channel) => await channel.send({ embeds: [modlogs],
                                }))
                            }}})
                        })} catch(e) {console.log(e)} 
                            })
                            try{
                                violationreason = `not specified`
                            } catch(e){}
                        })})
                    }})

                        
            //realmchat to discord
            this.client.on('text', (packet) => {
            try {
                if ((packet.source_name != this.client.username) && (packet.type === "chat")) {
                    console.log("Got a realm message from", `${packet.source_name}:`, packet.message)
                    const msg = packet.message
            
                    new Authflow('', `\\auth`, { relyingParty: 'http://xboxlive.com' }).getXboxToken().then(async (t) => {
                    
                        const XboxPFP = (await axios_1.default.get(`https://profile.xboxlive.com/users/gamertag(${packet.source_name})/profile/settings?settings=GameDisplayPicRaw`, {
                            headers: {
                                'x-xbl-contract-version': '2',
                                'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
                                "Accept-Language": "en-US"
                            }
                        })).data.profileUsers[0].settings[0].value;
            
                        var Color = (await axios_1.default.get(`https://profile.xboxlive.com/users/gamertag(${packet.source_name})/profile/settings?settings=PreferredColor`, {
                            headers: {
                                'x-xbl-contract-version': '2',
                                'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
                                "Accept-Language": "en-US"
                            }
                        })).data.profileUsers[0].settings[0].value;
                        var numb = Color.match(/\d/g);
                        numb = numb.join("");
            
                        let XboxPColor = (await axios_1.default.get(`https://dlassets-ssl.xboxlive.com/public/content/ppl/colors/${numb}.json`, {
                            headers: {
                                "Accept-Language": "en-US"
                        }
                    })).data.primaryColor;
            
                    
                    const playerMSG = new MessageEmbed()
                    .setAuthor(`<${packet.source_name}> ${msg}`, `${XboxPFP}`)
                    .setColor(`${XboxPColor}`)
                    discordClient.channels.fetch(relaychannel).then(async (channel) => await channel
                    .send({ embeds: [playerMSG]}))
                })}
            } catch (e) { console.log(e) }
        })
            

            this.client.on('packet', (packet) => { logOrIgnore(packet.data.name) })
            this.client.on('spawn', (packet) => {
                this.connectionReady = true;
            })
            this.client.on('join', (packet) => {
                this.connectionReady = true;
            })
        }, 5000)
        setTimeout(() => {
            // Checking for all-clear to send welcome message over the minecraft client...
            if (this.connectionReady) {
                console.log("Connection is ready! Sending welcome message...")
            } else {
                console.log("Connection is not ready! Waiting 5 more seconds before trying again...")
                setTimeout(() => {
                    if (this.connectionReady) {
                        console.log("Connection is ready! Sending welcome message...")

                    } else {
                        console.log("Connection is still not ready! Aborting welcome messag!")
                    }
                }, 5000)
            }
        }, 6000)
        
        // Discord Client Logic
        const discordClient = this.discordClient;
        discordClient.login(discordToken);

        discordClient.on("ready", async () => {
            const guild = await discordClient.guilds.fetch(guildId);
            // Send an embed in the designated discord channel
                });

        discordClient.on("messageCreate", (message) => {
            const msgAuthor = message?.author?.username ?? "";
            try {
                // Stop early if the message isn't in our bot channel
                if (message.channel.id !== relaychannel) { return }
                // Make sure it's not a message we just sent, an empty string, undefined, or authorless
                if (!(message.author.id === clientId || message.content.length === 0 || [null, undefined, ""].includes(msgAuthor))) {
                    this.handleDiscordMessage(message);
                }
            } catch (e) { console.log(e) }
        });
    }


    // Parse messages coming from discord
    async handleDiscordMessage(message) {
        const msgAuthor = message?.author?.username ?? "";
        let msg = message.content;
        const mentions = hasMentions(msg);
        const hasInvalid = !/^[\u0000-\u007f]*$/.test(msg);
        if (hasInvalid) {
            console.info(`Discarding message from [${msgAuthor}] with invalid characters`);
            return;
        }
        if (mentions) { // TODO: parse out multiple mentions
            try {
                const usrid = sanitizeString(mentions)
                const user = await this.discordClient.users.fetch(usrid);
                msg = message.content.replace(mentions, user.username);
            } catch (e) { console.log(e) }
        }
        await this.broadcast(`${msg}`, msgAuthor);
    }

    //discord to realmchat
    async broadcast(messageEvent, msgAuthor) {
        if (!(this.connectionReady)) {
            console.log(`Tried to broadcast to the realm before it was ready. \nCanceling message: ${messageEvent}`)
            return
        }
        let client = this.client
        let msg = `${chkMsg(messageEvent)}`;
        let bot_name = botName
        if (msgAuthor) {
            msg = `${msg}`;
        }
        if (!([null, undefined, ""].includes(client?.username))) { bot_name = client.username }
        this.client.queue('command_request', { command: `tellraw @a {"rawtext":[{"text":"§f[§9Discord§f] §a${msgAuthor}§f: ${msg}"}]}`, origin: { type: 'player', uuid: '', request_id: '', }, })
        }}

const bot = new DiscBot()
bot.onStartup()