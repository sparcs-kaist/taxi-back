import express from "express";
import logininfoHandler from "@/services/logininfo";

const router = express.Router();

router.route("/").get(logininfoHandler);

export default router;
