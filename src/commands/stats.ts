import { Command } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";
import { readFileSync, existsSync } from "fs";
import path from "path";

export class StatsCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("stats")
        .setDescription("Vaata serveri top 10 jutustajaid")
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const filePath = path.join(process.cwd(), "stats.json");

    if (!existsSync(filePath)) {
      await interaction.editReply("Messages.json faili ei leitud!");
      return;
    }

    const content = readFileSync(filePath, "utf8");
    const data: Record<
      string,
      { displayName: string; messages: number; words: number }
    > = JSON.parse(content);

    const leaderboard = Object.values(data).sort((a, b) => b.words - a.words);
    const topList = leaderboard
      .map((u, i) => `${i + 1}. **${u.displayName}** - ${u.words} sõna`)
      .slice(0, 10)
      .join("\n");
    const embed = new EmbedBuilder()
      .setTitle("Top 10")
      .setDescription(topList)
      .setColor("#db759c");

    await interaction.editReply({ embeds: [embed] });
  }
}
