const { completeQuest } = require("../modules/quests");
const logger = require("../../modules/logger");

const contracts = require("../modules/contracts");

const completeQuestHandler = async (req, res) => {
  try {
    const quest = contracts.quests[req.params.questId];
    if (!quest || !quest.isApiRequired)
      return res.status(400).json({ error: "Quests/complete: invalid quest" });

    // 출석 체크 퀘스트는 하루에 1번만 완료하도록 제한합니다.
    if (quest.id === "dailyAttendance") {
      const todayMidnight = new Date(req.timestamp);
      todayMidnight.setHours(0, 0, 0, 0);

      const tomorrowMidnight = new Date(todayMidnight);
      tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

      // 오늘 완료된 dailyAttendance 퀘스트가 있는지 확인합니다.
      const completedQuest = req.eventStatus.completedQuests.find(
        ({ id, completedAt }) =>
          id === quest.id &&
          completedAt >= todayMidnight &&
          completedAt < tomorrowMidnight
      );
      if (completedQuest) return res.json({ result: false });
    }

    const result = await completeQuest(req.userOid, req.timestamp, quest);
    res.json({ result: !!result }); // boolean으로 변환하기 위해 !!를 사용합니다.
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Quests/complete: internal server error" });
  }
};

module.exports = {
  completeQuestHandler,
};
