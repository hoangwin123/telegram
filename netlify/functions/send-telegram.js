const TELEGRAM_TOKEN = "";
const TARGET_CHAT_ID = "";

export default async (req) => {
    const { method } = req;
    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders(),
        });
    }

    if (method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Only POST supported' }), {
            status: 405,
            headers: corsHeaders(),
        });
    }

    try {
        const body = await req.json();
        const { mode = 'send', message, messageId, parseMode = 'HTML' } = body;

        if (mode === 'send') {
            if (!message) {
                return jsonError('Missing message', 400);
            }

            const telegramResponse = await callTelegram('sendMessage', {
                chat_id: TARGET_CHAT_ID,
                text: message,
                parse_mode: parseMode,
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    action: 'send',
                    messageId: telegramResponse.result?.message_id,
                }),
                { headers: corsHeaders() }
            );
        }

        if (mode === 'delete') {
            if (!messageId) {
                return jsonError('Missing messageId', 400);
            }

            await callTelegram('deleteMessage', {
                chat_id: TARGET_CHAT_ID,
                message_id: messageId,
            });

            return new Response(
                JSON.stringify({ success: true, action: 'delete' }),
                { headers: corsHeaders() }
            );
        }

        return jsonError('Invalid mode (use "send" or "delete")', 400);
    } catch (err) {
        console.error('Telegram proxy error:', err);
        return jsonError(err.message, 500);
    }
};

async function callTelegram(method, payload) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error(`Telegram API error: ${res.status} ${await res.text()}`);
    }
    return await res.json();
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };
}

function jsonError(message, status) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: corsHeaders(),
    });
}
