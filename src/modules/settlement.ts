export interface SettlementMeta {
  total: number;
  perPerson: number;
  participantCount: number;
}

/**
 * SettlementMeta를 파싱하는 함수입니다.
 * 
 * @param content SettlementMeta가 들어있는 content입니다.
 * SettlementMeta가 있으면 파싱 후 리턴하고, 없다면 undefined를 반환합니다.

 * total: 전체 금액,
 * perPerson: 인당 금액 (floor),
 * participantCount: 탑승 인원,
 */

export const parseSettlementMeta = (content: string | undefined | null) => {
  if (!content) return undefined;
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
};

export const buildPaymentContent = (
  content: string | undefined | null,
  fallback: string
) => {
  const meta = parseSettlementMeta(content);
  return meta ? (content as string) : fallback;
};
