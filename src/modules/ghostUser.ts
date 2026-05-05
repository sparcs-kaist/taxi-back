import { userModel } from "@/modules/stores/mongo";

export const GHOST_USER_ID = "weekly-taxi-room-ghost";
export const GHOST_USER_NAME = "유령";
export const GHOST_ROOM_NAME = "유령";

export const getOrCreateGhostUser = async () =>
  userModel.findOneAndUpdate(
    { id: GHOST_USER_ID },
    {
      $set: { name: GHOST_USER_NAME, nickname: GHOST_USER_NAME },
      $setOnInsert: {
        id: GHOST_USER_ID,
        profileImageUrl: "/profile-img/default/NupjukTaxi.png",
        joinat: new Date(0),
        email: "weekly-taxi-room-ghost@taxi.sparcs.org",
        withdraw: false,
        ban: false,
        agreeOnTermsOfService: false,
        isAdmin: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
