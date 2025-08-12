import express from "express";
import { getAllLocationsHandler } from "@/services/locations";

const router = express.Router();

router.get("/", getAllLocationsHandler);

export default router;
