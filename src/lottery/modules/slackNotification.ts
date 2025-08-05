import { sendTextToReportChannel } from "@/modules/slackNotification";
import type { Room } from "@/types/mongo";
import type { Types } from "mongoose";

const generateContent = (
  name: string,
  userIds: Types.ObjectId[],
  roomIds: Types.ObjectId[] = []
) => {
  if (userIds.length === 0) return "";

  const strUserIds = userIds.join(", ");
  const strRoomIds =
    roomIds.length > 0 ? ` (관련된 방: ${roomIds.join(", ")})` : "";
  return `\n    ${name}: ${strUserIds}${strRoomIds}`;
};

export const notifyAbuseDetectionResultToReportChannel = (
  abusingUserIds: Types.ObjectId[],
  reportedUserIds: Types.ObjectId[],
  multiplePartRooms: Room[][],
  multiplePartUserIds: Types.ObjectId[],
  lessChatRooms: {
    roomId: Types.ObjectId;
    parts: Types.ObjectId[];
  }[],
  lessChatUserIds: Types.ObjectId[]
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
    multiplePartRooms.reduce<Types.ObjectId[]>(
      (array, rooms) =>
        array.concat(
          rooms
            .map((room) => room._id)
            .filter((id): id is Types.ObjectId => id != null) // null 또는 undefined 제거
        ),
      []
    )
  );

  const strLessChatUsers = generateContent(
    "채팅 개수가 5개 미만인 방에 속한 사용자",
    lessChatUserIds,
    lessChatRooms.reduce<Types.ObjectId[]>(
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
