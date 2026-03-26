import { Router } from "express";
import { getMe, login, logout, logoutAll, refresh, register } from "../controllers/auth.controller.js";
import { identifyUser } from "../middlewares/auth.middleware.js";
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

/**
 * @route GET /api/auth/refresh-token
 * @description Refresh access token
 * @access Public
 */
authRouter.get("/refresh-token", refresh)

/**
 * @route GET /api/auth/logout
 * @description Logout a user
 * @access Private
 */
authRouter.get("/logout", identifyUser, logout)


/**
 * @route GET /api/auth/logout-all
 * @description Logout from all devices
 * @access Private
 */
authRouter.get("/logout-all", identifyUser, logoutAll)

export default authRouter
