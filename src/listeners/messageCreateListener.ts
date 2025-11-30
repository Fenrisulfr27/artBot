import { Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";

export class MessageCreateListener extends Listener {
  public constructor(context: Listener.Context) {
    super(context, {
      event: "messageCreate",
    });
  }

  public run(message: Message) {
    if (message.author.bot) return;

    const filePath = path.join(process.cwd(), "stats.json");

    let data: Record<
      string,
      { displayName: string; messages: number; words: number }
    > = {};
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf8");
      data = JSON.parse(content);
    }

    const authorId = message.author.id;
    const wordsCount = message.content
      .trim()
      .split(/\s+/) // jagab sõnad tühikute, tabide, reavahetuste järgi
      .filter(Boolean).length; // eemaldab tühjad kohad

    if (!data[authorId]) {
      data[authorId] = {
        displayName: message.member?.displayName || message.author.username,
        messages: 1,
        words: wordsCount,
      };
    } else {
      data[authorId].messages++;
      data[authorId].displayName =
        message.member?.displayName || message.author.username;
      data[authorId].words += wordsCount;
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(
      `Salvestatud sõnum: ${data[authorId].displayName} - ${data[authorId].messages} sõnumit kokku`
    );
  }
}
