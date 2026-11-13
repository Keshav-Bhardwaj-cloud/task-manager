import express from "express";
import {getAllTasks , getTaskById , createTask , updateTask , deleteTask} from "../controllers/task.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import { validateTask , validateTaskUpdate , validateTaskId , validateTaskQuery} from "../middleware/task.middleware.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { apiLimiter } from "../middleware/ratelimit.middleware.js";

const taskRouter = express.Router();



taskRouter.get("/",apiLimiter, authenticate , validateTaskQuery ,asyncWrapper(getAllTasks));

taskRouter.get("/:id", authenticate , validateTaskId, asyncWrapper(getTaskById));

taskRouter.post("/", authenticate ,validateTask, asyncWrapper(createTask));



taskRouter.patch("/:id", authenticate ,validateTaskId, validateTaskUpdate , asyncWrapper(updateTask));


taskRouter.delete("/:id",authenticate, validateTaskId , asyncWrapper(deleteTask));


export default taskRouter;