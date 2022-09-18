# DiscordjsMessageInteractions
Compatibility layer allowing Discord.js slash commands to run on message-based bots.

To use it, just pass MessageInteraction instead of an actual Message to your command. Mainly created to allow for easier migration,
and also to avoid code repitition for bots that implement both slash commands and message commands.
