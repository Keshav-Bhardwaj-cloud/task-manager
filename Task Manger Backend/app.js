import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors"
import helmet from "helmet"
import tasksRouter from "./routes/task.routes.js";
import authRouter from "./routes/auth.routes.js";
import logger from "./middleware/logger.middleware.js";
import mongoose from "mongoose"
import { errorHandler } from "./middleware/error.middleware.js";
import requestIdMiddleware from "./middleware/requestId.js"


const app = express();

console.log("MY BACKEND APP.JS HAS LOADED");

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

app.use(express.json({limit:"10kb"})); // Middleware to parse JSON request bodies


app.use(cookieParser())
app.use(helmet())
app.use(requestIdMiddleware)
app.use(logger); // Middleware to log requests
app.get("/health/ready",(req,res)=>{
    const isDatabaseConnected=mongoose.connection.readyState===1
    if (!isDatabaseConnected) {
        return res.status(503).json({
        success: false,
        status: "not_ready",
        database: "disconnected"
        });
    }

    return res.status(200).json({
        success: true,
        status: "ready",
        database: "connected"
    });
})

app.use('/auth', authRouter);

app.use('/api/v1/tasks', tasksRouter);

app.get("/health/live", (req, res) => {
    console.log("HEALTH ROUTE EXECUTED");
    return res.status(200).json({
        success: true,
        status: "alive"
    });
});


app.use(errorHandler); // Middleware to handle errors



export default app;
