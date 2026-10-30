
export type ArgumentSide = "Prosecutor" | "Defense";

export interface Argument {
  id: string;

  presentedBy: ArgumentSide;

  claim: string;

  reasoning: string;

  evidenceIds: string[];

  counterArguments: string[];
}

export interface AgentArguments {
  presentedBy: ArgumentSide;

  arguments: Argument[];
}
