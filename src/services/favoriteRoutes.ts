import { Request, Response } from "express";
import { favoriteRouteModel } from "@/modules/stores/mongo";
import { Types } from "mongoose";
import { getLoginInfo } from "@/modules/auths/login"; // 로그인 정보 가져오기

// ✅ 즐겨찾기 생성 (POST)
export const createHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getLoginInfo(req); // 로그인된 사용자 정보 가져오기
    if (!user.oid) {
      res.status(401).json({ error: "Unauthorized: No valid session found" });
      return;
    }

    const userId = user.oid;
    const { from, to } = req.body;

    const existingRoute = await favoriteRouteModel.findOne({
      user: userId,
      from,
      to,
    });
    if (existingRoute) {
      res
        .status(400)
        .json({ error: "FavoriteRoutes/create: route already exists" });
      return;
    }

    const newRoute = new favoriteRouteModel({ user: userId, from, to });
    await newRoute.save();

    res.status(201).json(newRoute);
  } catch (error) {
    res
      .status(500)
      .json({ error: "FavoriteRoutes/create: internal server error" });
  }
};

// ✅ 즐겨찾기 조회 (GET)
export const getHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getLoginInfo(req); // 로그인된 사용자 정보 가져오기
    if (!user.oid) {
      res.status(401).json({ error: "Unauthorized: No valid session found" });
      return;
    }

    const userId = user.oid;
    const routes = await favoriteRouteModel
      .find({ user: userId })
      .populate("from to");

    res.status(200).json(routes);
  } catch (error) {
    res
      .status(500)
      .json({ error: "FavoriteRoutes/get: internal server error" });
  }
};

// ✅ 즐겨찾기 삭제 (DELETE)
export const deleteHandler = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = getLoginInfo(req); // 로그인된 사용자 정보 가져오기

    if (!user.oid) {
      res.status(401).json({ error: "Unauthorized: No valid session found" });
      return;
    }

    const userId = user.oid;
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ error: "Invalid request: Missing or invalid route ID" });
      return;
    }

    const route = await favoriteRouteModel.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!route) {
      res
        .status(400)
        .json({ error: "FavoriteRoutes/delete: no corresponding route" });
      return;
    }

    res.status(200).json(route);
  } catch (error) {
    res
      .status(500)
      .json({ error: "FavoriteRoutes/delete: internal server error" });
  }
};
