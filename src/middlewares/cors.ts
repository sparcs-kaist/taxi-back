import cors from "cors";
import { corsWhiteList } from "@/loadenv";

const corsMiddleware = cors({
  origin: corsWhiteList,
  credentials: true,
  exposedHeaders: ["Date"],
});

export default corsMiddleware;
