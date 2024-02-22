const { sendTextToReportChannel } = require("../../modules/slackNotification");

const generateContent = (name, userIds, roomIds = []) => {
  if (userIds.length === 0) return "";

  const strUserIds = userIds.join(", ");
  const strRoomIds =
    roomIds.length > 0 ? ` (관련된 방: ${roomIds.join(", ")})` : "";
  return `\n    ${name}: ${strUserIds}${strRoomIds}`;
};

const notifyAbuseDetectionResultToReportChannel = (
  abusingUserIds,
  reportedUserIds,
  rooms,
  multiplePartUserIds,
  lessChatRooms,
  lessChatUserIds
) => {
  const title = `어제의 활동을 기준으로, ${abusingUserIds.length}명의 어뷰징 의심 사용자를 감지하였습니다.`;

  if (abusingUserIds.length === 0) {
    sendTextToReportChannel(title);
    return;
  }

  const strAbusingUsers = generateContent(
    "전체 어뷰징 의심 사용자",
    abusingUserIds
  );
  const strReportedUsers = generateContent(
    '"기타 사유"로 신고받은 사용자',
    reportedUserIds
  );
  const strMultiplePartUsers = generateContent(
    "하루에 탑승 기록이 많은 사용자",
    multiplePartUserIds,
    rooms.reduce((array, { roomIds }) => array.concat(roomIds), [])
  );
  const strLessChatUsers = generateContent(
    "채팅 개수가 5개 미만인 방에 속한 사용자",
    lessChatUserIds,
    lessChatRooms.reduce(
      (array, room) => (room ? array.concat([room.roomId]) : array),
      []
    )
  );
  const contents = strAbusingUsers.concat(
    strReportedUsers,
    strMultiplePartUsers,
    strLessChatUsers
  );

  sendTextToReportChannel(`${title}\n${contents}`);
};

module.exports = {
  notifyAbuseDetectionResultToReportChannel,
};
