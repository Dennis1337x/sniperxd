const WebSocket = require('ws');
const tls = require('tls');

const guilds = new Map();
const socket = new WebSocket("wss://gateway-us-east1-c.discord.gg");

socket.onmessage = async (message) => {
    const data = JSON.parse(message.data.toString());
    if (data.t === "GUILD_UPDATE" || data.t === "GUILD_DELETE") {
        const guildId = data.d.guild_id || data.d.id;
        const guild = await guilds.get(guildId);
        if (guild) {
            try {
                const patchUrl = "https://canary.discord.com/api/v8/guilds/SWID/vanity-url";
                const postUrl = 'https://discord.com/api/v10/channels/INFO ID/messages'; 
                const patchBody = JSON.stringify({ code: guild });
                const patchRequest = `PATCH ${patchUrl} HTTP/1.1\r\n` +
                    `Host: canary.discord.com\r\n` +
                    `Authorization: .GAjiB-.-\r\n` +
                    `Content-Type: application/json\r\n` +
                    `Content-Length: ${patchBody.length}\r\n\r\n` +
                    `${patchBody}`;
                
                const tlsSocket = tls.connect(443, 'canary.discord.com', () => {
                    tlsSocket.write(patchRequest);
                });

                tlsSocket.on('data', async (data) => {
                    const patchResult = data.toString();
                    const content = patchResult.ok ? `${data.t} | Vanity Taken: https://discord.gg/${guild} | @everyone` : `${data.t} | Vanity Check: ${guild} | @everyone`;
                    
                    const postBody = JSON.stringify({ content });
                    const postRequest = `POST ${postUrl} HTTP/1.1\r\n` +
                        `Host: discord.com\r\n` +
                        `Authorization: TOKEN\r\n` +
                        `Content-Type: application/json\r\n` +
                        `Content-Length: ${postBody.length}\r\n\r\n` +
                        `${postBody}`;

                    const postTlsSocket = tls.connect(443, 'discord.com', () => {
                        postTlsSocket.write(postRequest);
                    });

                    postTlsSocket.on('data', (data) => {
						console.log(`guild patch -> ${guild}`);
                        guilds.delete(guildId);
                    });
                });

            } catch (error) {
                console.error(`Error: ${error}`);
            }
        }
    } else if (data.t === "READY") {
        await data.d.guilds.forEach(async guild => {
            if (guild.vanity_url_code) await guilds.set(guild.id, guild.vanity_url_code);
        });
    }
    if (data.op === 10) {
        socket.send(JSON.stringify({
            op: 2,
            d: {
                token: ".GAjiB-.-",
                intents: 1 << 0,
                properties: { os: "Windows", browser: "Discord Client", device: "canary", },
            },
        }));
        setInterval(() => {
            socket.send(JSON.stringify({ op: 1, d: {} }));
        }, data.d.heartbeat_interval);
    } else if (data.op === 7) {
        console.log(data)
        process.exit(0);
    }
};

socket.onclose = () => {
    console.log("socket offline");
    process.exit();
};
