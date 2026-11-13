import AppError from "../errors/AppError.js";

export function errorHandler(err, req, res, next) {
    if(err.name==="CastError"){
       err= new AppError("Invalid ID format", 400);
    }

    if (
        err.name === "TokenExpiredError" ||
        err.name === "JsonWebTokenError"
    ) {
        err = new AppError("Invalid or expired token", 401);
    }

    if(err.name==="ValidationError"){
        const messages = Object.values(err.errors).map((error) => error.message);
        err= new AppError(messages.join(", "), 400);
    }

    if(err.statusCode>=500 || !err.statusCode){
        console.error({
            requestId: req.id,
            method:req.method,
            url:req.originalUrl,
            statuscode:err.statusCode||500,
            message:err.message});
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error:{message: err.message || "Something went wrong"}
        });
    }else {
        return res.status(500).json({
            success: false,
            error:{message: "Internal Server Error"}
        });
    }
}
 