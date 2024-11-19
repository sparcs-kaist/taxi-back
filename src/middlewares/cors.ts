import cors from "cors";
import config from "@/loadenv";

const corsMiddleware = cors({
  origin: config.corsWhiteList,
  credentials: true,
  exposedHeaders: ["Date"],
});

export default corsMiddleware;
