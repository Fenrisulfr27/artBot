import { Listener } from "@sapphire/framework";
import { TextChannel, type Message } from "discord.js";
import { openaiClient } from "../index.js";
import type {
  ResponseInput,
  ResponseInputItem,
} from "openai/resources/responses/responses.js";

export class MessageMentionListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, { ...options, event: "messageCreate" });
  }

  public async run(message: Message) {
    const bot = message.client.user;
    if (message.author.bot) return;

    const mentionedBot = message.mentions.has(bot);
    const referenceId = message.reference?.messageId;

    if (!mentionedBot) return;

    if (message.channel instanceof TextChannel) {
      await message.channel.sendTyping();
    }
    const typingLoop = setInterval(() => {
      if (message.channel instanceof TextChannel) {
        message.channel.sendTyping();
      }
    }, 8000);

    const inputBlocks: ResponseInput = [];

    if (referenceId) {
      const repliedMessage = await message.channel.messages
        .fetch(referenceId)
        .catch(() => null);

      if (repliedMessage) {
        const isBotMessage = repliedMessage.author.id === bot.id;

        inputBlocks.push({
          role: isBotMessage ? "assistant" : "user",
          content: repliedMessage.content,
        });
      }
    }
    inputBlocks.push({
      role: "user",
      content: [
        {
          type: "input_text",
          text: `${message.cleanContent.replace(`<@${bot.id}>`, "").trim()}`,
        },
      ],
    });

    console.log("SISEND OPENAI-LE:", JSON.stringify(inputBlocks, null, 2));
    const response = await openaiClient.responses.create({
      model: "gpt-5-nano",
      input: inputBlocks,
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
      instructions:
        "Vasta lühidalt, ole veits grumpy ja vasta nagu vastu tahtmist, ära paku ise mitte midagi",
    });
    clearInterval(typingLoop);
    await message.reply(response.output_text || "Viga AI vastuses.");
  }
}
