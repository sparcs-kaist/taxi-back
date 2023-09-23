const { completeQuest } = require("../modules/quests");
const logger = require("../../modules/logger");

const { eventConfig } = require("../../../loadenv");
const quests = eventConfig
  ? require(`../modules/contracts/${eventConfig.mode}`).quests
  : undefined;

const completeHandler = async (req, res) => {
  try {
    const quest = quests[req.params.questId];
    if (!quest || !quest.isApiRequired)
      return res.status(400).json({ error: "Quests/Complete: invalid Quest" });

    const result = await completeQuest(req.userOid, req.timestamp, quest);
    res.json({ result: !!result }); // boolean으로 변환하기 위해 !!를 사용합니다.
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Quests/Complete: internal server error" });
  }
};

module.exports = {
  completeHandler,
};
