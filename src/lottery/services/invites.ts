import { eventStatusModel } from "../modules/stores/mongo";
import { userModel } from "../../modules/stores/mongo";
import { resolveS3Url } from "../../modules/stores/aws";
import logger from "@/modules/logger";
import { eventConfig } from "@/loadenv";

import type { RequestHandler } from "express";
import type { EventStatus } from "../types";
import type { User } from "@/types/mongo";

export const searchInviterHandler: RequestHandler = async (req, res) => {
  try {
    const inviterStatus: EventStatus | null = await eventStatusModel
      .findById(req.params.inviter)
      .lean();
    if (
      !inviterStatus ||
      inviterStatus.isBanned ||
      !inviterStatus.isInviteUrlEnabled
    ) {
      return res
        .status(400)
        .json({ error: "Invites/search : invalid inviter" });
    }

    const inviter: User | null = await userModel
      .findOne(
        { _id: inviterStatus.userId, withdraw: false },
        "nickname profileImageUrl"
      )
      .lean();
    if (!inviter) {
      return res
        .status(500)
        .json({ error: "Invites/search : internal server error" });
    }

    return res.json({
      ...inviter,
      profileImageUrl: resolveS3Url(inviter.profileImageUrl),
    });
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ error: "Invites/search : internal server error" });
  }
};

export const createInviteUrlHandler: RequestHandler = async (req, res) => {
  try {
    const eventStatus = req.eventStatus;
    if (!eventStatus) {
      return res
        .status(500)
        .json({ error: "Invites/create : internal server error" });
    }

    const inviteUrl = `${req.origin}/event/${eventConfig?.mode}-invite/${eventStatus._id}`;

    if (eventStatus.isInviteUrlEnabled) {
      return res.json({ inviteUrl });
    }

    const { modifiedCount } = await eventStatusModel.updateOne(
      {
        _id: eventStatus._id,
        isInviteUrlEnabled: false,
      },
      {
        isInviteUrlEnabled: true,
      }
    );
    if (modifiedCount !== 1) {
      return res
        .status(500)
        .json({ error: "Invites/create : internal server error" });
    }

    return res.json({ inviteUrl });
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ error: "Invites/create : internal server error" });
  }
};
