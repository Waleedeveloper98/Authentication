import userModel from "../models/user.model.js"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import config from "../config/config.js"
import sessionModel from "../models/session.model.js"
import asyncHandler from "../middlewares/asyncHandler.js"
import AppError from "../utils/AppError.js"
import { generateTokens } from "../utils/token.js"
import setRefreshTokenCookie from "../utils/cookie.js"
import createSession from "../utils/session.js"

export const register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    const isAlreadyExists = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isAlreadyExists) {
        throw new AppError("An account with this username or email already exists. Please use different credentials.", 409)
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    })

    const { refreshToken, refreshTokenHash } = generateTokens(user._id)

    const session = await createSession(user._id, refreshTokenHash, req)

    const { accessToken } = generateTokens(user._id, session._id)

    setRefreshTokenCookie(res, refreshToken)

    return res.status(201).json({
        message: "Account created successfully. Welcome aboard!",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
        accessToken
    })
})

// Login an existing user
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        throw new AppError("Invalid email or password. Please check your credentials and try again.", 401)
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")

    const isPasswordMatched = user.password === hashedPassword;

    if (!isPasswordMatched) {
        throw new AppError("Invalid email or password. Please check your credentials and try again.", 401)
    }

    const { refreshToken, refreshTokenHash } = generateTokens(user._id)

    const session = await createSession(user._id, refreshTokenHash, req)

    const { accessToken } = generateTokens(user._id, session._id)

    setRefreshTokenCookie(res, refreshToken)

    return res.status(200).json({
        message: "Logged in successfully. Welcome back!",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
        accessToken
    })
})


// Get the currently authenticated user's profile
export const getMe = asyncHandler(async (req, res) => {
    const userId = req.user.id

    const user = await userModel.findById(userId)

    if (!user) {
        throw new AppError("User not found. The account may have been deleted.", 404)
    }

    return res.status(200).json({
        message: "Authenticated user profile fetched successfully.",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        }
    })
})


// Refresh the access token using a valid refresh token
export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new AppError("Refresh token is missing. Please log in again.", 401)
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET)
    } catch (error) {
        throw new AppError("Refresh token is invalid or has expired. Please log in again.", 401)
    }

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

    const session = await sessionModel.findOne({
        refreshTokenHash: refreshTokenHash,
        revoked: false
    })

    if (!session) {
        throw new AppError("Session not found or has been revoked. Please log in again.", 401)
    }

    const { accessToken } = generateTokens(decoded.id, session._id)

    const { refreshToken: newRefreshToken, refreshTokenHash: newRefreshTokenHash } = generateTokens(decoded.id)

    session.refreshTokenHash = newRefreshTokenHash
    await session.save()

    setRefreshTokenCookie(res, newRefreshToken)

    return res.status(200).json({
        message: "Access token refreshed successfully. New token issued.",
        accessToken
    })
})


// Logout the current session
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new AppError("No active session found. You may already be logged out.", 401)
    }

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

    const session = await sessionModel.findOne({
        refreshTokenHash: refreshTokenHash,
        revoked: false
    })

    if (!session) {
        throw new AppError("Session is invalid or has already been revoked.", 401)
    }

    session.revoked = true
    await session.save()

    res.clearCookie("refreshToken")

    return res.status(200).json({
        message: "Logged out successfully. Your session has been terminated."
    })
})


// Logout from all devices by revoking all sessions
export const logoutAll = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new AppError("No active session found. You may already be logged out from all devices.", 401)
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET)
    } catch (error) {
        throw new AppError("Refresh token is invalid or has expired. Please log in again.", 401)
    }

    await sessionModel.updateMany({
        user: decoded.id,
        revoked: false,
    }, {
        revoked: true
    })

    res.clearCookie("refreshToken")

    return res.status(200).json({
        message: "Successfully logged out from all devices. All active sessions have been revoked."
    })
})