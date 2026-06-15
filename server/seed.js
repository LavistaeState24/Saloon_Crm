import mongoose from "mongoose";
import { env } from "./src/config/env.js";

mongoose.connect(env.mongoUri);