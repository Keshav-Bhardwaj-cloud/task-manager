import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import RefreshToken from "../models/refreshToken.model.js";
import crypto from "crypto"
import AppError from "../errors/AppError.js";
import config from "../config/env.js";

export async function register(req, res ,next) {
    const { name , email , password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
    }
    const registerUser = await User.findOne({ email });
    if (registerUser) {
        return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully"});
}

export async function login(req, res ,next) {
    const {email , password }=req.body;
    if(!email || !password){
        return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user){
        return res.status(401).json({message:"Invalid Email or Password"})
    }
    const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
    );
    if(!isPasswordCorrect){
        return res.status(401).json({message:"Invalid Email or Password"})
    }
    const token=jwt.sign(
        {userId:user._id},
        config.jwtSecret,
        {expiresIn:"15min",algorithm: "HS256"}
    )

    const jti=crypto.randomUUID()
    const refreshToken=jwt.sign(
        {userId:user._id,
         jti   
        },
        config.jwtRefreshSecret,
        {expiresIn:"7d"}
    )

    const tokenHash=await bcrypt.hash(refreshToken,10)
    const expiresAt=new Date(Date.now()+ 7*24*60*60*1000)

    await RefreshToken.create({
        user:user._id,
        jti,
        tokenHash,
        expiresAt
    })

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true ,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge:7*24*60*60*1000})
    res.status(200).json({message:"Login Succesfully" ,token})
}



export async function refreshAccessToken(req , res , next){
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken){  
        return next(new AppError("refreshToken not found",401))
    }
    let decoded
    try{
        decoded=jwt.verify(refreshToken,config.jwtRefreshSecret)
    }catch(err){
        return next( new AppError("invalid or expired RefreshToken" ,401))
    }
    
        const storedToken= await RefreshToken.findOne({
            user:decoded.userId,
            jti:decoded.jti,
            revoked:false
        })

        if(!storedToken){
            return next(new AppError("invalid or revoked refresh token" ,401))
        }

        const isValid=await bcrypt.compare(refreshToken, storedToken.tokenHash)
        if(!isValid){
            return next(new AppError("invalid refresh token" ,401))
        }
        storedToken.revoked=true;
        await storedToken.save()

        const newJti=crypto.randomUUID()
        const newRefreshToken=jwt.sign(
            {userId:decoded.userId,
            jti:newJti
            },
            config.jwtRefreshSecret,
            {expiresIn:"7d"}
        )
        const newTokenHash=await bcrypt.hash(newRefreshToken,10)
        const newExpiresAt=new Date(Date.now()+7*24*60*60*1000)

        await RefreshToken.create({
            user:decoded.userId,
            jti:newJti,
            tokenHash:newTokenHash,
            expiresAt:newExpiresAt
        })
   
        const newAccessToken=jwt.sign({userId:decoded.userId},
            config.jwtSecret,
            {expiresIn:"15m"}
        )
        res.cookie("refreshToken", newRefreshToken , {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.status(200).json({message:"Refreshed succesfully" , newAccessToken})
}

export async function logout(req,res,next){
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken){  
        return next(new AppError("refreshToken not found",401))
    }
    try{
        const decoded=jwt.verify(refreshToken,config.jwtRefreshSecret)

        const storedToken= await RefreshToken.findOne({
            user:decoded.userId,
            jti:decoded.jti,
            revoked:false
        })

        if(!storedToken){
            return next(new AppError("invalid or revoked refresh token" ,401))
        }

        const isValid=await bcrypt.compare(refreshToken, storedToken.tokenHash)
        if(!isValid){
            return next(new AppError("invalid refresh token" ,401))
        }
        storedToken.revoked=true;
        await storedToken.save()

        res.clearCookie(refreshToken)
        res.status(200).json({message:"logged out succesfully" , refreshToken})
    }catch(err){
        return next( new AppError("invalid or expired RefreshToken" ,401))
    }

}


export async function logoutAll(req, res, next) {
    const userId=req.user.userId;

    await RefreshToken.updateMany(
        {user:userId,revoked:false},
        {revoked:true}
    )
    res.clearCookie("refreshToken")
    res.status(200).json({
        message: "Logged out from all devices successfully"
    });
}