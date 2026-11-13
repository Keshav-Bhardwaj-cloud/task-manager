import { describe,it ,expect ,vi , afterEach} from "vitest";
import { createTask } from "../service/task.service";
import Task from "../models/task.model.js"
afterEach(()=>{
    vi.resetAllMocks();
})

describe("createTask",()=>{
    it("returns the created task",async()=>{
        const spy=vi.spyOn(Task,"create")
        const taskData={
            title: "Learn testing",
            isCompleted: false
        }
        const createdTask={
            _id: "123",
            title: "Learn testing",
            isCompleted: false
        }
        spy.mockResolvedValue(createdTask)
        
        const result= await createTask(taskData)
        expect(spy).toHaveBeenCalledWith(taskData)
        expect(result).toEqual(createdTask);
    })
    it("propagates database error",async()=>{
        const error=new Error("database connection failed")
        const spy=vi.spyOn(Task,"create")
        const taskData={
            title: "Learn testing",
            isCompleted: false
        }
        spy.mockRejectedValue(error)
        await expect(createTask(taskData)).rejects.toThrow(error);
    })
})