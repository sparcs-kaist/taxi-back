export interface SettlementMeta {
  total: number;
  perPerson: number;
  participantCount: number;
}

export function parseSettlementMeta(content: string | undefined | null) {
  if (!content) return undefined as SettlementMeta | undefined;
  try {
    const parsed = JSON.parse(content) as Partial<SettlementMeta>;
    if (
      typeof parsed.total === "number" &&
      typeof parsed.perPerson === "number" &&
      typeof parsed.participantCount === "number"
    ) {
      return {
        total: parsed.total,
        perPerson: parsed.perPerson,
        participantCount: parsed.participantCount,
      } satisfies SettlementMeta;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function buildPaymentContent(
  content: string | undefined | null,
  fallback: string
) {
  const meta = parseSettlementMeta(content);
  return meta ? (content as string) : fallback;
}
