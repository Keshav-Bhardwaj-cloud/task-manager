import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import Task from "../models/task.model.js"
import {describe,it , expect, beforeEach, afterAll, beforeAll } from "vitest"
import request from 'supertest'
import config from "../config/env.js"

import app from "/app.js"

beforeAll(async()=>{
    const mongoUri = config.mongoUri;

if ( !mongoUri || !mongoUri.includes("task-manager-test")) {
    throw new Error("Tests must use the test database");
}

await mongoose.connect(mongoUri);
})
let token;
let testUser;
let testTask
beforeEach(async()=>{
    await User.deleteMany({});  
    testUser=await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123"
    })

    token=jwt.sign(
        {userId:testUser._id},
        config.jwtSecret
    )
    testTask=await Task.create({
    title: "Test task",
    isCompleted: false,
    user: testUser._id
});

})

afterAll(async()=>{
    await mongoose.disconnect()
})  

describe("testing configuration ", ()=>{
    it("testing whether configuration works or not",async()=>{
        console.log(`the mongo url is ${config.mongoUri}`)
        expect(config.mongoUri)
            .toBe("mongodb://localhost:27017/task-manager-test");
    })
})


describe("Task API integration test",()=>{
    it("testin the flow of request",async()=>{
        const response = await request(app).get("/api/v1/tasks").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(1);
        expect(response.body.data.tasks[0].title).toBe("Test task")
        expect(response.body.data.tasks[0].isCompleted).toBe(false)
        
    })

    it("rejects unauthenticated requests", async () => {
        const response = await request(app)
            .get("/api/v1/tasks");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false)
        
    })

    it("rejects invalid tokens", async () => {
        const response = await request(app)
            .get("/api/v1/tasks").set("Authorization",`Bearer invalid-token`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false)
        
    })
    
    it("rejects expired tokens", async () => {
        token=jwt.sign({userId:testUser._id},
            config.jwtSecret,
            {expiresIn:"-1s"}
        )
        const response = await request(app)
            .get("/api/v1/tasks").set("Authorization",`Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false)
        
    })

    it("prevents a user from accessing other users tasks", async () => {
        const anotherUser=await User.create({
            name:"Another User's",
            email:"another@example.com",
            password:"password123"
        })
        const anotherTask=await Task.create({
            title:"Another user's task",
            isCompleted:false,
            user:anotherUser._id
        })
        const response = await request(app)
            .get(`/api/v1/tasks/${anotherTask._id}`).set("Authorization",`Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false)
        expect(response.body.error.message).toBe("Task not found");
        
    })

    it("a user can access his own tasks", async () => {
        const anotherUser=await User.create({
            name:"Another User's",
            email:"another@example.com",
            password:"password123"
        })
        const anotherTask=await Task.create({
            title:"Another user's task",
            isCompleted:false,
            user:anotherUser._id
        })
        const response = await request(app)
            .get(`/api/v1/tasks/${testTask._id}`).set("Authorization",`Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true)
        expect(response.body.data._id).toBe(testTask._id.toString());
        
    })

   it("task created by authenticated user", async () => {
    const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "New test task"
        });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const taskId = response.body.data._id;

    const createdTask = await Task.findById(taskId);

    expect(createdTask).not.toBeNull();
    expect(createdTask.user.toString())
        .toBe(testUser._id.toString());
});

    it("task created by unauthenticated user",async ()=>{
        const countBefore=await Task.countDocuments()
        const response=await request(app).post("/api/v1/tasks").send({
            title:"Unauthorized task"
        })
        const countAfter=await Task.countDocuments()
        const createdTask=await Task.findOne({title:"Unauthorized task"})
        expect(countAfter).toBe(countBefore)
        expect(createdTask).toBeNull()
        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it("rejects the task creation with missing title ",async()=>{
        const countBefore=await Task.countDocuments();
        const response=await request(app).post("/api/v1/tasks").set("Authorization",`Bearer ${token}`).send({})
        const countAfter=await Task.countDocuments();
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(countAfter).toBe(countBefore)
    })
    it("rejects the task creation with invakid title ",async()=>{
        const countBefore=await Task.countDocuments();
        const response=await request(app).post("/api/v1/tasks").set("Authorization",`Bearer ${token}`).send({title:123})
        const countAfter=await Task.countDocuments();
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(countAfter).toBe(countBefore)
    })

    it("authenticated user can update thier own task",async()=>{
        const response=await request(app).patch(`/api/v1/tasks/${testTask._id}`).set("Authorization",`Bearer ${token}`).send({isCompleted:true})
        const updatedTask=await Task.findById(testTask._id)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.isCompleted).toBe(true)
        expect(updatedTask.isCompleted).toBe(true)
    })

    it("user A cannot update user B tasks",async ()=>{
        const anotherUser=await User.create({
            name:"Another User's",
            email:"another@example.com",
            password:"password123"
        })
        const anotherTask=await Task.create({
            title:"Another user's task",
            isCompleted:false,
            user:anotherUser._id
        })

        const response=await request(app).patch(`/api/v1/tasks/${anotherTask._id}`).set("Authorization",`Bearer ${token}`).send({
            isCompleted:true
        })
        const fetchTask=await Task.findById(anotherTask._id)
        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
        expect(fetchTask.isCompleted).toBe(false)
    })

    it("authencticated user can delete thier own task",async()=>{
        const response=await request(app).delete(`/api/v1/tasks/${testTask._id}`).set("Authorization" , `Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        const fetchTask=await Task.findById(testTask._id)
        expect(fetchTask).toBeNull()
    })

    it("user A cannot delete user B tasks",async ()=>{
        const anotherUser=await User.create({
            name:"Another User's",
            email:"another@example.com",
            password:"password123"
        })
        const anotherTask=await Task.create({
            title:"Another user's task",
            isCompleted:false,
            user:anotherUser._id
        })

        const response=await request(app).delete(`/api/v1/tasks/${anotherTask._id}`).set("Authorization",`Bearer ${token}`)
        const fetchTask=await Task.findById(anotherTask._id)
        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
        expect(fetchTask).not.toBeNull()
    })

    it("unauthenticated user cannot delete tasks",async()=>{
        const response=await request(app).delete(`/api/v1/tasks/${testTask._id}`)
        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        const fetchData=await Task.findById(testTask._id)
        expect(fetchData).not.toBeNull()
    })

    it("verifying iscompleted query",async()=>{
        const completedTask=await Task.create({
            title:"completed task",
            isCompleted:true,
            user:testUser._id
        })

        const response=await request(app).get("/api/v1/tasks?isCompleted=true").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(1)
        expect(response.body.data.tasks[0].isCompleted).toBe(true)
        expect(response.body.data.tasks[0]._id)
        .toBe(completedTask._id.toString());
       
    })

    it("verifying iscompleted query",async()=>{
        const completedTask=await Task.create({
            title:"completed task",
            isCompleted:true,
            user:testUser._id
        })

        const response=await request(app).get("/api/v1/tasks?isCompleted=false").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(1)
        expect(response.body.data.tasks[0].isCompleted).toBe(false)
        expect(response.body.data.tasks[0]._id)
        .toBe(testTask._id.toString());
       
    })

    it("verifying iscompleted query",async()=>{
        const secondTestTask=await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
            })

        const firstTestTask=await Task.create({
             title: "Go to gym",
            isCompleted: false,
            user: testUser._id
            })    

        const response=await request(app).get("/api/v1/tasks?search=Node").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(1)
        expect(response.body.data.tasks[0].title)
        .toBe("Learn Node.js");
       
    })

    it("verifying descending sorting query",async()=>{
        const secondTestTask=await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
            })

        const firstTestTask=await Task.create({
             title: "Go to gym",
            isCompleted: false,
            user: testUser._id
            })    

        const response=await request(app).get("/api/v1/tasks?sort=desc").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(3)
        expect(response.body.data.tasks[2].title)
        .toBe("Test task");
        expect(response.body.data.tasks[1].title)
        .toBe("Learn Node.js");
        expect(response.body.data.tasks[0].title)
        .toBe("Go to gym");
       
    })

    it("verifies ascending sort order", async () => {
    const secondTestTask = await Task.create({
        title: "Learn Node.js",
        isCompleted: false,
        user: testUser._id
    });

    const firstTestTask = await Task.create({
        title: "Go to gym",
        isCompleted: false,
        user: testUser._id
    });

    const response = await request(app)
        .get("/api/v1/tasks?sort=asc")
        .set("Authorization", `Bearer ${token}`);
        console.log(response.body)

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toHaveLength(3);

    expect(response.body.data.tasks[0]._id)
        .toBe(testTask._id.toString());

    expect(response.body.data.tasks[1]._id)
        .toBe(secondTestTask._id.toString());

    expect(response.body.data.tasks[2]._id)
        .toBe(firstTestTask._id.toString());
});
    
    it("verifying limit query",async()=>{
        const secondTestTask = await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
        });

        const thirdTestTask = await Task.create({
            title: "Go to gym",
            isCompleted: false,
            user: testUser._id
        });
        const response=await request(app).get("/api/v1/tasks?limit=2").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(2)
        expect(response.body.data.pagination.limit).toBe(2);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.hasNextPage).toBe(true);
    })

    it("verifying page and limit query",async()=>{
        const secondTestTask = await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
        });

        const thirdTestTask = await Task.create({
            title: "Go to gym",
            isCompleted: false,
            user: testUser._id
        });
        const response=await request(app).get("/api/v1/tasks?page=2&limit=2").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(1)
        expect(response.body.data.pagination.limit).toBe(2);
        expect(response.body.data.pagination.page).toBe(2);
        expect(response.body.data.pagination.hasNextPage).toBe(false);
        expect(response.body.data.tasks[0]._id).toBe(testTask._id.toString())
    })

    it("return empty array for out of range page",async()=>{
        const secondTestTask = await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
        });

        const thirdTestTask = await Task.create({
            title: "Go to gym",
            isCompleted: false,
            user: testUser._id
        });
        const response=await request(app).get("/api/v1/tasks?page=5&limit=2").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.pagination.limit).toBe(2);
        expect(response.body.data.pagination.page).toBe(5);
        expect(response.body.data.tasks).toEqual([])
    })

    it("reject non numeric page number and limit number",async()=>{
        
        const response=await request(app).get("/api/v1/tasks?page=abc&limit=hello").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it("reject invalid page limit number",async()=>{
        const response=await request(app).get("/api/v1/tasks?page=abc&limit=-1").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it("rejects page below 1", async () => {
    const response = await request(app)
        .get("/api/v1/tasks?page=0")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);})

    it("reject limit number greater than 100",async()=>{
        const response=await request(app).get("/api/v1/tasks?limit=101").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it("accepts minimum valid pagination values", async () => {
    const response = await request(app)
        .get("/api/v1/tasks?page=1&limit=1")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination.page).toBe(1);
    expect(response.body.data.pagination.limit).toBe(1);
    });

    it("accepts maximum valid limit", async () => {
    const response = await request(app)
        .get("/api/v1/tasks?page=1&limit=100")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination.page).toBe(1);
    expect(response.body.data.pagination.limit).toBe(100);
    });

    it("combining isCompleted and search",async()=>{
        const secondTestTask = await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
        });

        const thirdTestTask = await Task.create({
            title: "Learn MongoDb",
            isCompleted: false,
            user: testUser._id
        });
        const fourthTestTask = await Task.create({
            title: "Go to gym",
            isCompleted: true,
            user: testUser._id
        });
        const response =await request(app).get("/api/v1/tasks?isCompleted=false&search=Node").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(1)
        expect(response.body.data.tasks[0]._id).toBe(secondTestTask._id.toString())
    })


    it("combining sort and search",async()=>{
        const secondTestTask = await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
        });

        const thirdTestTask = await Task.create({
            title: "Node authentication",
            isCompleted: false,
            user: testUser._id
        });
        const fourthTestTask = await Task.create({
            title: "Go to gym",
            isCompleted: true,
            user: testUser._id
        });
        const response =await request(app).get("/api/v1/tasks?sort=asc&search=Node").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(2)
        expect(response.body.data.tasks[0]._id).toBe(secondTestTask._id.toString())
        expect(response.body.data.tasks[1]._id)
          .toBe(thirdTestTask._id.toString());
    })

    it("combining filter and pagination",async()=>{
        const secondTestTask = await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
        });

        const thirdTestTask = await Task.create({
            title: "Node authentication",
            isCompleted: false,
            user: testUser._id
        });
        const fourthTestTask = await Task.create({
            title: "Go to gym",
            isCompleted: true,
            user: testUser._id
        });

        const fifthTestTask = await Task.create({
            title: "Buy Groceries",
            isCompleted: false,
            user: testUser._id
        });

        const response =await request(app).get("/api/v1/tasks?isCompleted=false&page=2&limit=2").set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks).toHaveLength(2)
        expect(response.body.data.tasks[0]._id)
            .toBe(secondTestTask._id.toString());

        expect(response.body.data.tasks[1]._id)
            .toBe(testTask._id.toString());
            
        expect(response.body.data.tasks[0].isCompleted).toBe(false);
        expect(response.body.data.tasks[1].isCompleted).toBe(false);
    })


    it("matching the complete flow of the tasks ",async()=>{
        const secondTestTask = await Task.create({
            title: "Learn Node.js",
            isCompleted: false,
            user: testUser._id
        });

        const thirdTestTask = await Task.create({
            title: "Node authentication",
            isCompleted: false,
            user: testUser._id
        });
        const fourthTestTask = await Task.create({
            title: "Go to gym",
            isCompleted: true,
            user: testUser._id
        });
        const response=await request(app).get('/api/v1/tasks?isCompleted=false&search=Node&sort=asc&limit=1').set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.tasks[0]._id).toBe(secondTestTask._id.toString())
        expect(response.body.data.tasks).toHaveLength(1)
        expect(response.body.data.pagination.limit).toBe(1)
        expect(response.body.data.tasks[0].isCompleted).toBe(false);
        expect(response.body.data.tasks[0].title).toBe("Learn Node.js");
    })

    it("rejects malformed task ID", async () => {
        const response=await request(app).get("/api/v1/tasks/not-a-valid-id").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    });

    it("returns 404 for a valid but non-existent task ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response=await request(app).get(`/api/v1/tasks/${nonExistentId}`).set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
    });

    it("rejects whitespace-only task title", async () => {
    const countBefore = await Task.countDocuments();

    const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "   "
        });

    const countAfter = await Task.countDocuments();

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(countAfter).toBe(countBefore);
    });

    it("rejects invalid isCompleted value", async () => {
    const countBefore = await Task.countDocuments();

    const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Invalid completed task",
            isCompleted: "true"
        });

    const countAfter = await Task.countDocuments();

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(countAfter).toBe(countBefore);
    });

    it("allows unknown fields during task creation", async () => {
    const countBefore = await Task.countDocuments();

    const response = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
            title: "Task with unknown field",
            isCompleted: false,
            admin: true
        });

    const countAfter = await Task.countDocuments();

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(countAfter).toBe(countBefore+1);
});

it("rejects unknown fields during task update", async () => {
    const response = await request(app)
        .patch(`/api/v1/tasks/${testTask._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            admin: true
        });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    const task = await Task.findById(testTask._id);
    expect(task).not.toBeNull();
});


    it("updating with same value",async()=>{
        const response = await request(app).patch(`/api/v1/tasks/${testTask._id}`).set("Authorization", `Bearer ${token}`)
        .send({
            isCompleted:false
        });
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.isCompleted).toBe(false)
    })

    it("updating with empty string",async()=>{
        const tasksBefore=await Task.countDocuments()
        const response = await request(app).patch(`/api/v1/tasks/${testTask._id}`).set("Authorization", `Bearer ${token}`)
        .send({title:""
        });
        const taskAfter=await Task.countDocuments()
        const taskAfterUpdate=await Task.findById(testTask._id)
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(tasksBefore).toBe(taskAfter)
        expect(taskAfterUpdate.title).toBe("Test task");
    })

    it("rejects update using malformed task ID", async () => {
        const taskBefore=await Task.countDocuments()
        const response=await request(app).patch("/api/v1/tasks/not-a-valid-id").set("Authorization", `Bearer ${token}`);
        const taskAfter=await Task.countDocuments()
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(taskBefore).toBe(taskAfter)

    });

        it("returns 404 for updating using a valid ID but non-existent task ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response=await request(app).patch(`/api/v1/tasks/${nonExistentId}`).set("Authorization", `Bearer ${token}`).send({
                isCompleted:true
            });
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
        });


     
    it("delete own tasks",async()=>{
        const response= await request(app).delete(`/api/v1/tasks/${testTask._id}`).set("Authorization",`Bearer ${token}`)
        const deletedTask = await Task.findById(testTask._id);
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(deletedTask).toBeNull();
    })

    it("delete another user's tasks",async()=>{
        const anotherUser=await User.create({
            name:"Another User's",
            email:"another@example.com",
            password:"password123"
        })
        const anotherTask=await Task.create({
            title:"another user's task",
            isCompleted:false,
            user:anotherUser._id

        })
        const response= await request(app).delete(`/api/v1/tasks/${anotherTask._id}`).set("Authorization",`Bearer ${token}`)
        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
    })

    it("rejects unauthenticated task deletion",async()=>{
        const response= await request(app).delete(`/api/v1/tasks/${testTask._id}`)
        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it("returns 404 for deleting using a valid ID but non-existent task ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response=await request(app).delete(`/api/v1/tasks/${nonExistentId}`).set("Authorization", `Bearer ${token}`).send({
                isCompleted:true
            });
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
        });

})