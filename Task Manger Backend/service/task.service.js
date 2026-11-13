import NotFoundError from "../errors/NotFoundError.js";
import Task from "../models/task.model.js";


export async function createTask(TaskData) {
        const task=await Task.create(TaskData)
        return task
       
}

export async function getAllTasks({ userId , isCompleted , search , sort ,limit ,page} ) {

        const query = {user:userId};
        
        if (isCompleted !== undefined) {
            query.isCompleted = isCompleted === "true";
        }

        if (search) {
            query.title = { $regex: search, $options: "i" }; // Case-insensitive search
        }

        const limitNum = limit !== undefined ? Number(limit) : 10;
        const pageNum = page !== undefined ? Number(page) : 1;
        const skip=(pageNum-1)*limitNum

        let tasksQuery = Task.find(query).select("title isCompleted").skip(skip).limit(limitNum+1).lean()

        if (sort === "asc") {
            tasksQuery = tasksQuery.sort({ _id: 1 });
        } else {
            tasksQuery = tasksQuery.sort({ _id: -1 });
        }
    
        const tasks = await tasksQuery; // Start with all tasks
        const hasNextPage=tasks.length>limitNum
        if (hasNextPage) {
            tasks.splice(limitNum);
        }
        return {tasks,hasNextPage , limitNum ,pageNum}               
}


export async function getTaskById(taskInfo) {
    const task= await Task.findOne(taskInfo).populate("user" , "name email");
    if(!task){ 
        throw new NotFoundError("Task not found");
    }
    return task

}

export async function updateTask(taskInfo,updateData) {
    const task= await Task.findOne(taskInfo);
    if(!task){
        throw new NotFoundError("Task not found");
    }

    if(updateData.title!==undefined){      
        task.title=updateData.title;
    }
    if(updateData.isCompleted!==undefined){
        task.isCompleted=updateData.isCompleted;
    }
    await task.save();
    return task;
    
}

export  async function deleteTask(taskInfo) {
        const deletedTask= await Task.findOneAndDelete(taskInfo);
        if(!deletedTask){
            throw new NotFoundError("Task not found");
        }
        return deletedTask
    

    }