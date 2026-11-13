import rateLimit from "express-rate-limit"

export const apiLimiter=rateLimit({
    windowMs:15*60*1000,
    limit:100,
    message: {
        message: "Too many requests. Please try again later."
    }

})

export const loginLimiter=rateLimit({
    windowMs:15*60*1000,
    limit:5,
    message: {
        message: "Too many login attempts. Please try again later."
    }
})
