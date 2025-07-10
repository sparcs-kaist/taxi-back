import type { RequestHandler } from "express";
import { noticeModel } from "../modules/stores/mongo";

export const getNoticesHandler: RequestHandler = async (req, res) => {
  try {
    const pinnedNotice = await noticeModel.find({
      is_active: true,
      is_pinned: true,
    });

    const notices = await noticeModel.find({
      is_active: true,
      is_pinned: false,
    });

    return res.status(200).json({ notices: [...pinnedNotice, ...notices] });
  } catch (e) {
    return res.status(500).send("notice/list: Failed to load notices");
  }
};
