export interface CourtLogEntry {
    eventType: string;
    participantId: string;
    content: unknown;
    timestamp: string;
}

export const courtLog: CourtLogEntry[] = [];