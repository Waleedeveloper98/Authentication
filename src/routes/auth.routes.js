import { Router } from "express";
import { getMe, login, register } from "../controllers/auth.controller.js";
import identifyUser from "../middlewares/auth.middleware.js";
const authRouter = Router()


/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", register)

/**
 * @route POST /api/auth/login
 * @description Login a user
 * @access Public
 */
authRouter.post("/login", login)

/**
 * @route GET /api/auth/me
 * @description Get current user
 * @access Private
 */
authRouter.get("/get-me", identifyUser, getMe)

export default authRouter
