import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import express from "express";
import morgan from "morgan";

import { env, getMissingAwsS3EnvVars, isAwsS3Configured } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware.js";
import apiRoutes from "./routes/index.js";

const app = express();
const allowedOrigins = new Set(env.clientUrls);
const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = origin?.replace(/\/+$/, "");

    if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    config: {
      nodeEnv: env.nodeEnv,
      awsS3Configured: isAwsS3Configured(),
      missingAwsS3EnvVars: getMissingAwsS3EnvVars(),
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
