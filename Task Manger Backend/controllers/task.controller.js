
import { createTask as createTaskService  , getAllTasks as getAllTasksService , getTaskById as getTaskByIdService ,
    updateTask as updateTaskService , deleteTask as deleteTaskService} from "../service/task.service.js";

import { sendResponse } from "../utils/sendResponse.js";    


export async function getAllTasks(req, res) {
    
        const { isCompleted , search , sort ,limit ,page} = req.query;
        const userId=req.user.userId;
        const {tasks , hasNextPage , limitNum , pageNum} = await getAllTasksService({userId,isCompleted,search,sort,limit ,page}); // Start with all tasks
        const data={tasks, pagination:{hasNextPage ,limit:limitNum , page:pageNum}}
        sendResponse(res ,200,data);
                       
}

export async function getTaskById(req, res) {
    const taskInfo={_id:req.params.id ,user:req.user.userId}
    const task= await getTaskByIdService(taskInfo)
     sendResponse(res,200,task);
    
}

export async function createTask(req, res) {
        const TaskData={...req.body , user:req.user.userId};
        const task=await createTaskService(TaskData)
        sendResponse(res , 201,task,"Task created successfully")
    
    
}

export async function updateTask(req, res ) {
    const taskInfo={_id:req.params.id ,user:req.user.userId }
    const updateData=req.body;
    const task= await updateTaskService(taskInfo ,updateData)
    sendResponse(res ,200, task, "Task updated successfully")
    
}

export  async function deleteTask(req, res) {
        const taskInfo={_id:req.params.id ,user:req.user.userId }
        const deletedTask=await deleteTaskService(taskInfo);
        sendResponse(res , 200 , deletedTask, "Task deleted successfully");

    }