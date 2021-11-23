import { codeBlock, SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandHandler } from "./index";
import { queueTimelockTransaction } from "./time-lock-transactions";
import { config } from "../network-config";
import moment from "moment";

async function execute(interaction: CommandInteraction) {
  const allocationPoints = interaction.options.getNumber("allocation_points");
  const lpAddress = interaction.options.getString("token_address");
  const rewarderAddress =
    interaction.options.getString("rewarder_address") ??
    "0x0000000000000000000000000000000000000000";
  const eta =
    interaction.options.getInteger("eta") ??
    moment()
      .add(8 * 60, "minutes")
      .unix();

  const contractInteraction = await queueTimelockTransaction({
    targetContract: {
      name: "BeethovenxMasterChef",
      address: config.contractAddresses.MasterChef,
    },
    value: 0,
    targetFunction: {
      identifier: "add",
      args: [allocationPoints, lpAddress, rewarderAddress],
    },
    eta: eta,
  });

  await interaction.reply({
    content: codeBlock(
      `
      Contract: ${contractInteraction.contract}
      Data: ${contractInteraction.data}`
    ),
    ephemeral: true,
  });
}

export const farmsAdd: CommandHandler = {
  definition: new SlashCommandBuilder()
    .setName("farms_add")
    .setDescription("Generate hex data to queue adding a farm on timelock")
    .addStringOption((option) =>
      option
        .setName("token_address")
        .setDescription("Token address (e.g BPT)")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("allocation_points")
        .setDescription("Allocation points (weight) of the farm")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("rewarder_address")
        .setDescription("Rewarder contract address")
    )
    .addNumberOption((option) =>
      option.setName("eta").setDescription("Time of execution (defaults to 8h)")
    ),
  execute,
};
