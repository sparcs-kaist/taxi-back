import { completeQuest } from "../modules/quests";
import logger from "@/modules/logger";
import { quests } from "../modules/contracts";

import { z } from "zod";
import { questsZod } from "@/lottery/routes/docs/schemas/questsSchema";
import type { Request, Response } from "express";

export const completeQuestHandler = async (req: Request, res: Response) => {
  try {
    if (!quests) {
      return res
        .status(500)
        .json({ error: "Quests/complete: internal server error" });
    }

    const RequestParams = questsZod.completeQuestHandler.parse(req.params);

    // const RequestParams: z.infer<typeof questsZod.completeQuestHandler> =
    //   req.params;
    const quest = quests[RequestParams.questId];

    if (!quest || !quest.isApiRequired) {
      return res.status(400).json({ error: "Quests/complete: invalid quest" });
    }

    // 출석 체크 퀘스트는 하루에 1번만 완료하도록 제한합니다.
    if (quest.id === "dailyAttendance") {
      const todayMidnight = new Date(req.timestamp!);
      todayMidnight.setHours(0, 0, 0, 0);

      const tomorrowMidnight = new Date(todayMidnight);
      tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

      // 오늘 완료된 dailyAttendance 퀘스트가 있는지 확인합니다.
      const completedQuest = req.eventStatus!.completedQuests.find(
        ({ questId, completedAt }) =>
          questId === quest.id &&
          completedAt >= todayMidnight &&
          completedAt < tomorrowMidnight
      );
      if (completedQuest) return res.json({ result: false });
    }

    const result = await completeQuest(req.userOid!, req.timestamp!, quest);
    res.json({ result: !!result }); // boolean으로 변환하기 위해 !!를 사용합니다.
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Quests/complete: internal server error" });
  }
};
