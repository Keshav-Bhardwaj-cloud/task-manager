import { describe, it, expect, vi ,beforeEach,beforeAll,afterAll} from "vitest"
import request from "supertest"
import app from "../app.js"
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import config from "../config/env.js";
import RefreshToken from "../models/refreshToken.model.js";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import crypto from "node:crypto";


beforeAll(async()=>{
    const mongoUri = config.mongoUri;

    if ( !mongoUri || !mongoUri.includes("task-manager-test")) {
    throw new Error("Tests must use the test database");
    }

await mongoose.connect(mongoUri);
})
let token;
let testUser;

beforeEach(async()=>{
    await User.deleteMany({}); 
    testUser=await User.create({
        name: "Test User",
        email: "task-failure@example.com",
        password: "password123"
    })

    token=jwt.sign(
        {userId:testUser._id},
        config.jwtSecret
    )
    
})

afterAll(async()=>{
    await mongoose.disconnect()
})  

vi.mock("../service/task.service.js",async(importOrignal)=>{
    const actual=await importOrignal();

    return {
        ...actual,getAllTasks:vi.fn(actual.getAllTasks)
    }
})

import { getAllTasks } from "../service/task.service.js";


describe("database failure test",()=>{
    it("returns 500 when the task service fails", async () => {
    getAllTasks.mockRejectedValueOnce(new Error("Database Failure"))
    const response = await request(app)
        .get("/api/v1/tasks").set("Authorization",`Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).not.toBe("Database Failure");
}); 

    it("returns 500 when the refresh-token database lookup fails", async () => {
    // Create a valid refresh JWT for the test user.
    const refreshToken = jwt.sign(
        {
            userId: testUser._id.toString(),
            jti: "test-refresh-token-id"
        },
        config.jwtRefreshSecret,
        { expiresIn: "7d" }
    );

    // Simulate a database failure on the next findOne() call.
    vi.spyOn(RefreshToken, "findOne").mockRejectedValueOnce(
        new Error("Database Failure")
    );

    // Send the refresh JWT through the Cookie request header.
    const response = await request(app)
        .post("/auth/refreshAccessToken")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

    // Verify that the server treats the database failure as a 500.
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();

    // Ensure the raw database error message is not exposed.
    expect(response.body.error.message).not.toBe("Database Failure");
});

    it("replacement-token creation failing after the old token has been revoked",async()=>{
        const oldJti = crypto.randomUUID();
        const refreshToken = jwt.sign(
        {
            userId: testUser._id.toString(),
            jti: oldJti
        },
        config.jwtRefreshSecret,
        { expiresIn: "7d" }
        );
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        const oldToken = await RefreshToken.create({ 
            user: testUser._id,
            jti: oldJti,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        });
        const createSpy=vi.spyOn(RefreshToken, "create").mockRejectedValueOnce( new Error("Database Failure") );
        const response = await request(app) .post("/auth/refreshAccessToken") .set("Cookie", [`refreshToken=${refreshToken}`]);
        expect(response.status).toBe(500);
        const updatedOldToken = await RefreshToken.findById(oldToken._id);
        expect(updatedOldToken.revoked).toBe(true);
        createSpy.mockRestore();
    })

})