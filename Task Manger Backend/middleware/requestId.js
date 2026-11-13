import {randomUUID}from "node:crypto"

const requestIdMiddleware=(req,res,next)=>{
    req.id=randomUUID()
    res.setHeader("X-Request-ID", req.id);
    next()
};

export default requestIdMiddleware;