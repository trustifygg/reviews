import { ChatInputCommand } from '#structure/ChatInputCommand';
import { ApplyCommandOption, Command } from '#structure/Command';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

@ApplyCommandOption(
	new SlashCommandBuilder().setName('review').setDescription('Create a review through this command.'),
	{ allowDM: false }
)
export class UserCommand extends ChatInputCommand {
	public override async runTask(
		interaction: ChatInputCommandInteraction<'cached'>,
		options: Command.ChatInputOptions,
		client: Client<true>
  ) {
    await interaction.reply({ content: "This is a review"})
  }
}
