import { Bot, Context, InlineKeyboard } from "grammy";
import dotenv from "dotenv";

dotenv.config();

interface Review {
    text: string;
    username: string;
    userId: number;
    messageId: number;
}

const CONFIG = {
    botToken: process.env.BOT_TOKEN!,
    adminId: Number(process.env.ADMIN_ID),
    channelId: Number(process.env.CHANNEL_ID),
} as const;

const bot = new Bot(CONFIG.botToken);
const reviews = new Map<string, Review>();
const waitingReview = new Set<number>();

const getReviewKey = (userId: number, messageId: number): string => 
    `${userId}_${messageId}`;

const formatUsername = (username?: string): string => 
    username ? `@${username}` : "Аноним";

const sendAdminMessage = async (
    ctx: Context,
    message: string,
    keyboard?: InlineKeyboard
) => {
    await ctx.api.sendMessage(CONFIG.adminId, message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
    });
};

bot.catch((err) => {
    const ctx = err.ctx;
    console.log(`[BOT] Ошибка в обработчике обновления`, {
        updateId: ctx?.update?.update_id,
        error: err.error,
    });
});

bot.command("start", async (ctx) => {
    try {
        await ctx.reply("Привет, чтобы оставить отзыв, жми на кнопку ниже 👇", {
            reply_markup: new InlineKeyboard().text("Оставить отзыв", "write_feedback"),
        });
    } catch(error) {
        console.error("[BOT] Ошибка в обработчике /start: ",error);
    }
});

bot.callbackQuery("write_feedback", async (ctx) => {
    try {
        if (!ctx.from) return;

        waitingReview.add(ctx.from.id);
        await ctx.reply("Напиши свой отзыв:");
        await ctx.answerCallbackQuery();
    } catch (error) {
        console.error("[BOT] Ошибка в обработчике callback - writefeedback: ", error);
    }
});

bot.on("message:text", async (ctx) => {
    try {
        if (!ctx.from || !ctx.message?.text) return;

        const { id: userId, username } = ctx.from;
        const { text, message_id: messageId } = ctx.message;

        if (!waitingReview.has(userId)) return;
            waitingReview.delete(userId);

            const review: Review = {
                text,
                username: formatUsername(username),
                userId,
                messageId,
            };

            reviews.set(getReviewKey(userId, messageId), review);

            const adminKeyboard = new InlineKeyboard()
                .text("✅ Одобрить", `approve_${userId}_${messageId}`)
                .text("❌ Отклонить", `reject_${userId}_${messageId}`);

            await sendAdminMessage(
                ctx,
                `<b>Новое сообщение</b>\n<b>Пользователь:</b>\n<blockquote>${review.username}</blockquote>\n<b>Отзыв:</b>\n<blockquote>${text}</blockquote>`,
                adminKeyboard
            );

            await ctx.reply("Отзыв был отправлен на модерацию!");
    } catch (error) {
        console.error("[BOT] Ошибка в обработчике текста: ");
    }
});

bot.on("callback_query:data", async (ctx) => {
    try {
        const callbackData = ctx.callbackQuery?.data;
        if (!callbackData) return;

        const [action, userIdStr, messageIdStr] = callbackData.split("_");
        const userId = Number(userIdStr);
        const messageId = Number(messageIdStr);
        const reviewKey = getReviewKey(userId, messageId);

        if (action === "approve") {
            const review = reviews.get(reviewKey);
            if (review) {
                await ctx.api.sendMessage(
                    CONFIG.channelId,
                    `<b>Отзыв</b>\n<b>От:</b>\n<blockquote>${review.username}</blockquote>\n<b>Отзыв:</b>\n<blockquote>${review.text}</blockquote>`,
                    { parse_mode: "HTML" }
                );
                await sendAdminMessage(ctx, "✅ Отзыв был опубликован");
            } else {
                await sendAdminMessage(ctx, "❌ Отзыв не найден");
            }
        } else if (action === "reject") {
            await sendAdminMessage(ctx, "❌ Отзыв был отклонен");
        }

        reviews.delete(reviewKey);
        await ctx.answerCallbackQuery();
    } catch (error) {
        console.error("[BOT] Ошибка в обработчике callback: ");
    }
});

async function startBot() {
    try { 
        bot.start();
        console.log('[BOT] Бот успешно запущен');
    } catch (error) {
        console.error("[BOT] Ошибка при запуске бота:  ", error);
    }
}
startBot();
