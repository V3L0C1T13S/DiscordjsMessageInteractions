import {
  ApplicationCommandOptionType,
  Collection, Interaction, Snowflake, User,
} from "discord.js";
import { msgOptions } from "./messageToInteraction";

export class MentionsArray {
  private interaction: Interaction;

  private options: msgOptions;

  users: Collection<Snowflake, User>;

  constructor(interaction: Interaction, options: msgOptions) {
    this.interaction = interaction;
    this.options = options;

    const mentions: Collection<Snowflake, User> = new Collection();

    options.data.forEach((value) => {
      if (value.user && value.type === ApplicationCommandOptionType.User) mentions.set(value.user.id, value.user);
    });

    this.users = mentions;
  }
}
