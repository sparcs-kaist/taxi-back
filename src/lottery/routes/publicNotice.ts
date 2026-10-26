import express from "express";
// import {
//   getGroupLeaderboardHandler,
//   getRecentPurchaceItemListHandler,
// } from "../services/publicNotice";

import type { Router } from "express";

export const router: Router = express.Router();

// 아래의 Endpoint들은 2025 봄 이벤트에서 사용되지 않습니다.
//
// router.get("/leaderboard", publicNoticeHandlers.getGroupLeaderboardHandler);

// router.get(
//   "/recentTransactions",
//   publicNoticeHandlers.getRecentPurchaceItemListHandler
// );
