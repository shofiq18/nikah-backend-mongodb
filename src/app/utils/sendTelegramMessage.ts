import config from '../../config/index.js';

/**
 * Sends an HTML formatted message to the Telegram bot/channel.
 * @param message The text message (supports basic HTML tags)
 */
export const sendTelegramMessage = async (message: string): Promise<void> => {
  const token = config.telegram_bot_token;
  const chatId = config.telegram_chat_id;

  if (!token || !chatId) {
    console.warn('[Telegram] BOT_TOKEN or CHAT_ID is not configured in the environment.');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Telegram] API Error Response:', errorData);
    } else {
      console.log('[Telegram] Notification sent successfully');
    }
  } catch (error: any) {
    console.error('[Telegram] Request failed:', error.message);
  }
};
