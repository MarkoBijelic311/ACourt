import {
  SituationSpecification,
  type SituationContext,
} from "@mozaik-ai/core";

export class EventTypeSpecification extends SituationSpecification {
  constructor(private readonly eventType: string) {
    super();
  }

  isSatisfiedBy(context: SituationContext): boolean {
    return context.event.type === this.eventType;
  }
}
