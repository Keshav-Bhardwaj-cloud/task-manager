import config from "./config/env.js";
import connectDB from "./config/db.js";
import app  from "./app.js";
import mongoose from "mongoose";


const startServer=async () => {
    try{
        await connectDB();
        const server=app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
            });

        let isShuttingDown=false;
        
        const shutdown=async (signal)=>{
            if(isShuttingDown) return;
                isShuttingDown=true ;
                console.log(`${signal} received. Starting graceful shutdown...`);
                const forceShutdownTimer = setTimeout(() => {
                    console.error("Graceful shutdown timed out. Forcing exit.");
                    process.exit(1);
                    }, 10000);

                forceShutdownTimer.unref();

                if (server.listening) {
                    server.close(async (error) => {
                        if (error) {
                            console.error("Server shutdown failed:", error);
                            process.exitCode = 1;
                        }

                        try {
                            await mongoose.connection.close();
                            console.log("Mongoose connection closed");
                        } catch (dbError) {
                            console.error("Mongoose shutdown failed:", dbError);
                            process.exitCode = 1;
                        } finally {
                            clearTimeout(forceShutdownTimer);
                        }
                    });
                } else {
                    console.log("HTTP server is already stopped.");

                    await mongoose.connection.close();
                    console.log("Mongoose connection closed");

                    clearTimeout(forceShutdownTimer);
                }
        }
        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM")); 
    } catch (error) {
        console.error("Failed to connect to database:", error.message);
        process.exitCode=1
    }
}

startServer();