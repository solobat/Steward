import type { Command } from "@/commands";

export interface CommandAvailabilityContext {
  inPage: boolean;
}

export interface CommandAvailability {
  available: boolean;
  reason?: string;
}

export function getCommandAvailability(
  command: Command,
  context: CommandAvailabilityContext
): CommandAvailability {
  const requiresPageContext =
    command.pageOnly || command.capabilityRequirements?.includes("pageContext");

  if (requiresPageContext && !context.inPage) {
    return {
      available: false,
      reason: "Only available in the in-page command box",
    };
  }

  return { available: true };
}
