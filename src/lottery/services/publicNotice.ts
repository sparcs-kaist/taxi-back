import { eventStatusModel, transactionModel } from "../modules/stores/mongo";
import { userModel } from "../../modules/stores/mongo";
import { isLogin, getLoginInfo } from "../../modules/auths/login";
import logger from "@/modules/logger";
import { publicNoticePopulateOption } from "../modules/populates/transactions";
import { eventConfig } from "@/loadenv";
import type { RequestHandler } from "express";

import type { EventStatus, Item } from "../types";
import type { LeanDocument } from "mongoose";

// import type { Request, Response } from "express";

/**
 * getValueRank 사용자의 상품 구매 내역 또는 경품 추첨 내역의 순위 결정을 위한 가치를 평가하는 함수
 * 상품 가격이 높을수록, 상품 구매 일시가 최근일 수록 가치가 높습니다.
 * 요청이 들어온 시간과 트랜젝션이 있었던 시간의 차를 로그스케일로 변환후 이를 가격에 곱하여 가치를 구합니다.
 * 시간의 단위는 millisecond입니다.
 * t_1/2(반감기, half-life)는 4일입니다 .
 * (2일 = 2 * 24 * 60 * 60 * 1000 = 172800000ms)
 * Tau는 반감기를 결정하는 상수입니다.
 * Tau = t_1/2 / ln(2) 로 구할 수 있습니다.
 * Tau = 249297703
 * N_0(초기값)는 item.price를 사용합니다.
 * @description 가치를 기준으로 정렬하기 위해 사용됨
 */
// const getValueRank = (
//   item: LeanDocument<Item>,
//   createAt: number | Date,
//   timestamp: number
// ) => {
//   const t = timestamp - new Date(createAt).getTime(); // millisecond
//   const Tau = 249297703;
//   return item.price * Math.exp(-t / Tau);
// };

// export const getRecentPurchaceItemListHandler: RequestHandler = async (
//   req,
//   res
// ) => {
//   try {
//     const transactions = (
//       await transactionModel
//         .find({ type: "use", itemType: 0 })
//         .sort({ createAt: -1 })
//         .limit(1000)
//         .populate(publicNoticePopulateOption) // TODO: 회원 탈퇴 핸들링
//         .lean()
//     )
//       .sort((x, y) => {
//         if (!x.item || !y.item) return 0; // or some other logic
//         return (
//           getValueRank(y.item, y.createdAt, req.timestamp!) -
//           getValueRank(x.item, x.createdAt, req.timestamp!)
//         );
//       })
//       .slice(0, 5)
//       .map(({ userId, item, comment, createdAt }) => ({
//         text: `${userId.nickname}님께서 ${item.name}${
//           comment.startsWith(eventConfig?.credit.name)
//             ? "을(를) 구입하셨습니다."
//             : comment.startsWith("랜덤박스")
//             ? "을(를) 뽑았습니다."
//             : "을(를) 획득하셨습니다."
//         }`,
//         createdAt,
//       }));
//     res.json({ transactions });
//   } catch (err) {
//     logger.error(err);
//     res.status(500).json({
//       error: "PublicNotice/RecentTransactions : internal server error",
//     });
//   }
// };

const calculateProbabilityV2 = (
  users: LeanDocument<EventStatus>[],
  weightSum: number,
  weight: number
) => {
  // 유저 수가 상품 수보다 적거나 같으면 무조건 상품을 받게된다.
  if (users.length <= 15) return 1;

  /**
   * 실험적으로 발견한 사실
   *
   * x를 티켓 수라고 하면, 실제 당첨 확률은 1-a^x꼴의 지수함수를 따르는 것을 시뮬레이션을 통해 발견하였다.
   * 이때 a는 전체 유저 수, 전체 티켓 수, 각 유저의 티켓 수에 의해 결정되는 값이다.
   *
   * a값의 계산 과정
   *
   * 매번 a값을 정확하게 계산하는 것은 현실적으로 어렵다.
   * 따라서, 모든 유저가 같은 수의 티켓을 가지고 있다고 가정하고 a를 계산한 뒤, 이를 확률 계산에 사용한다.
   * M을 전체 티켓 수, N을 전체 유저 수라고 하자.
   * 모든 유저가 같은 수의 티켓 M/N개를 가지고 있다면, 한 유저가 상품에 당첨될 확률은 15/N임을 직관적으로 알 수 있다.
   * 실제 당첨 확률은 1-a^x꼴의 지수함수를 따르므로, 1-a^(M/N) = 15/N이라는 식을 세울 수 있다.
   * a에 대해 정리하면, a = (1-15/N)^(N/M)을 얻는다.
   */
  const base = Math.pow(1 - 15 / users.length, users.length / weightSum);
  return 1 - Math.pow(base, weight);
};

// 2023 가을 이벤트를 위한 리더보드 API 핸들러입니다.
export const getTicketLeaderboardHandler: RequestHandler = async (req, res) => {
  try {
    const users = await eventStatusModel
      .find({
        $or: [{ ticket1Amount: { $gt: 0 } }, { ticket2Amount: { $gt: 0 } }],
      })
      .lean();
    const sortedUsers = users
      .map((user) => ({
        userId: user.userId.toString(),
        ticket1Amount: user.ticket1Amount,
        ticket2Amount: user.ticket2Amount,
        weight: user.ticket1Amount + 5 * user.ticket2Amount,
      }))
      .sort((a, b) => -(a.weight - b.weight));

    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    let rank = -1;

    const [weightSum, totalTicket1Amount, totalTicket2Amount] =
      sortedUsers.reduce(
        (
          [_weightSum, _totalTicket1Amount, _totalTicket2Amount],
          user,
          index
        ) => {
          if (rank < 0 && user.userId === userId) {
            rank = index;
          }
          return [
            _weightSum + user.weight,
            _totalTicket1Amount + user.ticket1Amount,
            _totalTicket2Amount + user.ticket2Amount,
          ];
        },
        [0, 0, 0]
      );
    const leaderboard = await Promise.all(
      sortedUsers.slice(0, 20).map(async (user) => {
        // 여기서 userId는 oid입니다.
        const userInfo = await userModel
          .findOne({ _id: user.userId, withdraw: false })
          .lean();
        if (!userInfo) {
          logger.error(`Fail to find user ${user.userId}`);
          return null;
        }
        return {
          nickname: userInfo.nickname,
          profileImageUrl: userInfo.profileImageUrl,
          ticket1Amount: user.ticket1Amount,
          ticket2Amount: user.ticket2Amount,
          probability: user.weight / weightSum,
          probabilityV2: calculateProbabilityV2(users, weightSum, user.weight),
        };
      })
    );
    if (leaderboard.includes(null))
      return res
        .status(500)
        .json({ error: "PublicNotice/Leaderboard : internal server error" });

    res.json({
      leaderboard,
      totalTicket1Amount,
      totalTicket2Amount,
      totalUserAmount: users.length,
      ...(rank >= 0
        ? {
            rank: rank + 1,
            probability: sortedUsers[rank].weight / weightSum,
            probabilityV2: calculateProbabilityV2(
              users,
              weightSum,
              sortedUsers[rank].weight
            ),
          }
        : {}),
    });
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "PublicNotice/Leaderboard : internal server error" });
  }
};

// 2024 봄 이벤트를 위한 리더보드 API 핸들러입니다.
export const getGroupLeaderboardHandler: RequestHandler = async (req, res) => {
  try {
    const leaderboardWithoutMvp = await eventStatusModel.aggregate([
      {
        $group: {
          _id: "$group",
          creditAmount: { $sum: "$creditAmount" },
        },
      }, // group을 기준으로 사용자들의 creditAmount를 합산합니다.
      {
        $project: {
          _id: false,
          group: "$_id",
          creditAmount: true,
        },
      }, // _id 필드의 이름을 group으로 변경합니다.
      {
        $sort: {
          creditAmount: -1,
          group: 1,
        },
      }, // creditAmount를 기준으로 내림차순 정렬합니다. creditAmount가 같을 경우 group을 기준으로 오름차순 정렬합니다.
    ]);
    const leaderboard = await Promise.all(
      leaderboardWithoutMvp.map(async (group) => {
        const mvp = await eventStatusModel
          .find({ group: group.group })
          .sort({ creditAmount: -1 })
          .limit(1) // Aggreation을 사용하는 것보다, sort와 limit을 바로 붙여 사용하는 것이 더 효율적입니다.
          .lean();
        if (mvp?.length !== 1)
          throw new Error(`Fail to find MVP in group ${group.group}`);

        const mvpInfo = await userModel
          .findOne({ _id: mvp[0].userId, withdraw: false })
          .lean();
        if (!mvpInfo) throw new Error(`Fail to find user ${mvp[0].userId}`);

        return {
          ...group,
          mvpNickname: mvpInfo.nickname,
          mvpProfileImageUrl: mvpInfo.profileImageUrl,
        };
      })
    );

    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const user = userId && (await eventStatusModel.findOne({ userId }).lean());
    if (user) {
      res.json({
        leaderboard,
        group: user.group,
        rank: leaderboard.findIndex((group) => group.group === user.group) + 1,
      });
    } else {
      res.json({ leaderboard });
    }
  } catch (err) {
    logger.error(err);
    res
      .status(500)
      .json({ error: "PublicNotice/Leaderboard : internal server error" });
  }
};
