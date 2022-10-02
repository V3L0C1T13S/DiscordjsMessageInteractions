import {
  ApplicationCommandOptionType,
  Collection, CommandInteraction, GuildMember, MessageMentions, Snowflake, User,
} from "discord.js";
import { msgOptions } from "./messageToInteraction";

export class MentionsArray {
  static EveryonePattern = MessageMentions.EveryonePattern;

  static ChannelsPattern = MessageMentions.ChannelsPattern;

  static RolesPattern = MessageMentions.RolesPattern;

  static UsersPattern = MessageMentions.UsersPattern;

  private interaction: CommandInteraction;

  private options: msgOptions;

  users: Collection<Snowflake, User>;

  _members?: Collection<Snowflake, GuildMember>;

  get members() {
    if (this._members) return this._members;
    if (!this.interaction.guild) return null;

    this._members = new Collection();

    this.users.forEach((user) => {
      const member = this.interaction.guild?.members.resolve(user);
      if (member) this._members?.set(member.id, member);
    });

    return this._members;
  }

  constructor(interaction: CommandInteraction, options: msgOptions) {
    this.interaction = interaction;
    this.options = options;

    const mentions: Collection<Snowflake, User> = new Collection();

    options.data.forEach((value) => {
      if (value.user && value.type === ApplicationCommandOptionType.User) mentions.set(value.user.id, value.user);
    });

    this.users = mentions;
  }
}
