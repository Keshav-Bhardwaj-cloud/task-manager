import AppError from "../errors/AppError.js";
import { isBoolean ,isString , isValidObjectId } from "../validators/common.validators.js";

export function validateTask(req, res, next) {
    const { title ,isCompleted } = req.body;
    const isWhitespace= (title)=>title.trim()==='';
    if (!title) {
                return next(new AppError("Title is required" , 400))
        
    }

    if(!isString(title)){
                return next(new AppError("Title must be string" , 400))
        }

    if(isWhitespace(title)){
                return next(new AppError("Title can't be empty" , 400))
            }

     
    if (
        isCompleted !== undefined &&
        !isBoolean(isCompleted)
    ) {
        return next(new AppError("isCompleted must be boolean", 400));
    }        

    next();
}


export function validateTaskUpdate(req, res, next) {
    const { title, isCompleted } = req.body;
    const isWhitespace= (title)=>title.trim()==='';

    const allowedFields = ["title", "isCompleted"];

    if(Object.keys(req.body).length===0){
        return next(new AppError("nothing to update",400))
    }

    for (const field of Object.keys(req.body)) {
        if (!allowedFields.includes(field)) {
            return next(new AppError( `Field '${field}' is not allowed` , 400))
        }
    }

    if (title !== undefined && !isString(title)) {
        return next(new AppError( "Title must be string" , 400))
    }
    if(title!==undefined && isWhitespace(title)){
                return next(new AppError("Title can't be empty" , 400))
            }

    if (
        isCompleted !== undefined &&
        !isBoolean(isCompleted)
    ) {
        return next(new AppError( "ifCompleted must me boolean" , 400))
    }

    next();
}


export function validateTaskId(req,res,next){
    const TaskId=req.params.id

    if(!isValidObjectId(TaskId)){
        return next(new AppError("Invalid Task Id" , 400))
    }

    next()
}  

export function validateTaskQuery(req,res,next){
    const {isCompleted, sort , limit , search ,page}=req.query;
    if ( isCompleted!==undefined && isCompleted !== "true" && isCompleted !== "false"){
        return next(new AppError("Invalid query parameter. Use 'true' or 'false'." , 400))
    }
    if ( sort!==undefined && sort !== "asc" && sort!=="desc") {
            return next(new AppError("Invalid query parameter. Use 'asc' or 'desc'." , 400))
    } 

   if (limit !== undefined) {
    const limitNum = Number(limit);

    if (isNaN(limitNum) || limitNum <= 0 || limitNum>100) {
        return next(new AppError(
            "Limit must be a number greater than 0 and less than or equal to 100",
            400
        ));
     }
    }

    if(page!==undefined){
        const pageNum=Number(page)
        if(isNaN(pageNum)||pageNum<1){
            return next(new AppError("page must be a number greater than or equal to 1",400))
        }
    }

    if (search !== undefined && !isString(search)) {
        return next(new AppError( "Search must be string" , 400))
    }
    next()
}