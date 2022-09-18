import {
  Collection,
  DMChannel,
  Guild,
  GuildMember,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
  Snowflake,
  TextBasedChannel,
  User,
  APIInteractionGuildMember,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  cleanContent,
  Client,
  ChannelType,
} from "discord.js";
import { MentionsArray } from "./MentionsArray";

export type msgOptions = ChatInputCommandInteraction["options"] | ContextMenuCommandInteraction["options"];

/**
 * Provides polyfills for commands still using message.reply, message.channel, etc.
 * @param interaction The interaction to polyfill
 * @param ephemeral Whether or not the interaction reply should be hidden
 * @param options The interaction options to use, otherwise known as arguments.
 * @param defer Should we tell Discord to give us more time?
*/
export default class InteractionMessage {
  private readonly interaction: Interaction;
  private readonly interactionOptions: msgOptions;
  private ephemeral: boolean;
  private responded = false;

  private channelFaked = false;

  applicationId?: string;

  author: User;

  readonly channel: TextBasedChannel;

  channelId: string;

  createdTimeStamp: number;

  user: User;

  member: GuildMember | APIInteractionGuildMember | null;

  mentions: MentionsArray;

  guild?: Guild;

  content: string;

  readonly createdAt: Date;

  createdTimestamp: number;

  readonly client: Client;

  get cleanContent() {
    return this.content != null ? cleanContent(this.content, this.channel) : null;
  }

  deletable = false;

  get editable() {
    const precheck = Boolean(this.author.id === this.client.user?.id && (!this.guild || (this.channel.type !== ChannelType.DM && this.channel?.viewable)));
    // Regardless of permissions thread messages cannot be edited if
    // the thread is locked.
    if (this.channel?.isThread()) {
      return precheck && !this.channel.locked;
    }
    return precheck;
  }

  editedTimestamp?: number;

  get editedAt() {
    return this.editedTimestamp && new Date(this.editedTimestamp);
  }

  private readonly defer: boolean;

  constructor(interaction: Interaction, ephemeral: boolean, options: msgOptions, defer = true) {
    this.interaction = interaction;
    this.ephemeral = ephemeral;
    this.interactionOptions = options;
    this.defer = !!defer;
    this.responded = this.defer;

    this.channel = this.interaction.channel || (() => {
      this.channelFaked = true;
      // We need to fake a channel to have commands work
      const channel = Object.create(DMChannel.prototype);
      // @ts-ignore
      channel.send = <T>(...args: T[]) => this.reply(...args);

      return channel;
    })();

    this.user = this.interaction.user;

    this.author = this.interaction.user;

    this.createdTimeStamp = this.interaction.createdTimestamp;

    this.member = this.interaction.member;

    this.guild = this.interaction.guild || undefined;
    this.content = this.commandOptionsToString(this.interactionOptions);

    this.createdAt = this.interaction.createdAt;
    this.createdTimestamp = this.interaction.createdTimestamp;

    this.mentions = new MentionsArray(this.interaction, options);

    this.applicationId = this.interaction.client.application?.id;

    this.channelId = this.channel.id;

    this.client = this.interaction.client;
  }

  private createReplyMsg(content: string | MessagePayload) {
    if (typeof content === "string") return { content };

    return content as unknown as InteractionReplyOptions;
  }

  /**
   * Replies to the interaction
   * */
  async reply(content: string | MessagePayload): Promise<InteractionMessage> {
    if (!this.interaction.isCommand()) throw new Error("Not a command");

    if (this.defer) {
      const res = await this.edit(content);
      return res;
    }

    const finalMsg = this.createReplyMsg(content);
    finalMsg.ephemeral = this.ephemeral;

    if (this.responded) await this.interaction.followUp(finalMsg);
    else {
      this.responded = true;
      await this.interaction.reply(finalMsg);
    }

    this.responded = true;

    return this;
  }

  /**
   * Converts interaction options to a suffix suitable for use in classic
   * text-based commands.
   * */
  commandOptionsToString(options: msgOptions) {
    let finalSuffix = "";

    options.data.forEach((value) => {
      finalSuffix = finalSuffix.concat(`${value.value?.toString()}`);
    });

    return finalSuffix;
  }

  /**
   * Deletes the reply for our interaction,
   * (but only if we've responded and this isnt an ephemeral reply)
   * */
  async delete(timeout?: number): Promise<InteractionMessage> {
    if (!this.interaction.isCommand()) throw new Error("Not a command");

    if (!this.responded) throw new Error("Not responded");
    // not sure if this is gonna cause issues in the future but for now we'll just ignore it
    if (this.ephemeral) return this;

    if (!this.interaction.isCommand()) throw new Error("Not a command");
    await this.interaction.deleteReply();
    return this;
  }

  async edit(content: string | MessagePayload): Promise<InteractionMessage> {
    if (!this.interaction.isCommand()) throw new Error("Not a command");

    if (!this.responded) throw new Error("Not responded");

    const finalMsg = this.createReplyMsg(content);
    await this.interaction.editReply(finalMsg);
    return this;
  }

  toString() {
    return this.content;
  }

  valueOf() {
    return this.interaction.valueOf();
  }
}
