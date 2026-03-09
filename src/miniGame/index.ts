import express from "express";

import miniGameRouter from "./routes/miniGames";

import { getDictionary } from "./modules/dictionary";

getDictionary();

const router = express.Router();

router.use("/miniGames", miniGameRouter);

export default router;
