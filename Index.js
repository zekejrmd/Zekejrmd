// index.js
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnecting...")
                startBot()
            } else {
                console.log("❌ Logged out. Delete session and scan again.")
            }
        } else if (connection === 'open') {
            console.log("✅ ZekejrMD bot is now online!")
        }
    })

    // Respond to new messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return
        const from = msg.key.remoteJid
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text

        if (!body) return

        console.log(`📩 Message from ${from}: ${body}`)

        if (body.toLowerCase() === "hi") {
            await sock.sendMessage(from, { text: "Hello 👋, I’m ZekejrMD bot!" })
        } else if (body.toLowerCase() === "menu") {
            await sock.sendMessage(from, { text: "📜 Commands List:\n1. hi\n2. menu" })
        }
    })
}

startBot()
