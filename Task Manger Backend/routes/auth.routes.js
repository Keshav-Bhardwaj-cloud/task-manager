import express from "express";
import asyncWrapper from "../middleware/asyncWrapper.js";
import authenticate from "../middleware/auth.middleware.js";
import { register , login , refreshAccessToken , logout, logoutAll} from "../controllers/auth.controller.js";
import { loginLimiter } from "../middleware/ratelimit.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", asyncWrapper(register));

authRouter.post("/login",loginLimiter, asyncWrapper(login));

authRouter.post("/refreshAccessToken", asyncWrapper(refreshAccessToken));

authRouter.post("/logout", asyncWrapper(logout));

authRouter.post("/logoutAll", authenticate , asyncWrapper(logoutAll));

export default authRouter;