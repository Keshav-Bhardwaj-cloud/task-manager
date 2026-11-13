import dotenv from "dotenv"

dotenv.config()

const requiredEnv = [
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "PORT",
    "NODE_ENV"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

const port =Number(process.env.PORT)
if(!Number.isInteger(port) || port<1 ||port >65535){
    throw new Error("PORT must be an integer between 1 and 65535")
}


const allowedFields=["production","development","test"]
const nodeEnv=process.env.NODE_ENV;

if(!allowedFields.includes(nodeEnv)){
    throw new Error("NODE_ENV must be development, test, or production")
}

const jwtSecret= process.env.JWT_SECRET

const jwtRefreshSecret= process.env.JWT_REFRESH_SECRET


if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
}

if (jwtRefreshSecret.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be at least 32 characters long");
}

if (jwtSecret === jwtRefreshSecret) {
    throw new Error("JWT secrets must be different");
}

const config = {
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    port,
    nodeEnv
};

export default config;