import type { RequestHandler } from "express";
import { noticeModel } from "../modules/stores/mongo";

// 공지사항 조회 서비스 함수
export const getNoticesHandler: RequestHandler = async (req, res) => {
  try {
    const pinnedNotice = await noticeModel.findOne({
      is_active: true,
      is_pinned: true,
    });

    const notices = await noticeModel.find({
      is_active: true,
      is_pinned: false,
    });

    if (pinnedNotice) {
      return res.status(200).json({ notices: [pinnedNotice, ...notices] });
    }

    return res.status(200).json({ notices });
  } catch (e) {
    return res.status(500).send("notice/list: Failed to load notices");
  }
};
