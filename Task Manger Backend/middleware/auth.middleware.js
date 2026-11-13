import jwt from "jsonwebtoken"
import AppError from "../errors/AppError.js";
import config from "../config/env.js";

export default function authenticate(req , res , next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return next(new AppError("Missing authorization header", 401));
    }
    const [scheme , token]=authHeader.split(" ")
    if(scheme!=="Bearer" || !token ){
        return next(new AppError( "Invalid authorization header" , 401))
    }
    try{
        const decoded =jwt.verify(token,config.jwtSecret , {algorithms: ["HS256"]})   
        req.user=decoded
        next();
    }catch(err){
        next(err)
    }
}