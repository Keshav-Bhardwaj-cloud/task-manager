import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
    {
        user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true
            },
        jti: {
                type: String,
                required: true,
                unique: true
            },
        tokenHash:{
            type:String ,
            required:true,
            unique:true
        },
        expiresAt:{
            type:Date,
            required:true
        },
        revoked:{
            type:Boolean,
            default:false
        },
    },
          {
            timestamps:true
        }
)

const RefreshToken=mongoose.model("RefreshToken",refreshTokenSchema);
export default RefreshToken