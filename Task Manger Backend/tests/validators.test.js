import {describe , it , expect} from "vitest"
import { isBoolean, isString , isValidObjectId } from "../validators/common.validators"

describe("isBoolean",()=>{
    it("returns true for boolean values",()=>{
        expect(isBoolean(true)).toBe(true)
        expect(isBoolean(false)).toBe(true)
    })
    it("returns false for non-boolean values", () => {
    expect(isBoolean("true")).toBe(false);
    expect(isBoolean("false")).toBe(false);
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean(null)).toBe(false);
});
})


describe("isString",()=>{
    it("returns true for string values",()=>{
        expect(isString("Abc")).toBe(true)
        expect(isString("")).toBe(true);
    })
    it("returns false for non-string values",()=>{
        expect(isString(120)).toBe(false)
        expect(isString(true)).toBe(false)
        expect(isString([])).toBe(false)
    })
})


describe("isValidObjectId",()=>{
    it("returns true for valid object id",()=>{
        expect(isValidObjectId("653a8d0d9a907b00018654a0")).toBe(true)
    })
    it("returns false for invalid object id",()=>{
        expect(isValidObjectId(120)).toBe(false)
        expect(isValidObjectId("hello")).toBe(false)
        expect(isValidObjectId("")).toBe(false)
        expect(isValidObjectId("zzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
    })
})

