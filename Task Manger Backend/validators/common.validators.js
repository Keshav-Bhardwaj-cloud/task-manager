import mongoose from "mongoose";

export function isString(value){
    return typeof value === "string";
}

export function isBoolean(value){
    return typeof value ==="boolean";
}


export function isValidObjectId(value){
    return mongoose.Types.ObjectId.isValid(value);
}