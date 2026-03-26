import userModel from "../models/user.model.js"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import config from "../config/config.js"
import sessionModel from "../models/session.model.js"

export const register = async (req, res) => {
    const { username, email, password } = req.body

    const isAlreadyExists = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isAlreadyExists) {
        return res.status(409).json({
            message: "An account with this username or email already exists. Please use different credentials."
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    })

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, { expiresIn: "7d" })

    const refreshTokenHashed = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash: refreshTokenHashed,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id,
    }, config.JWT_SECRET, { expiresIn: "15m" })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    })

    return res.status(201).json({
        message: "Account created successfully. Welcome aboard!",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
        accessToken
    })
}

export const login = async (req, res) => {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password. Please check your credentials and try again."
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")

    const isPasswordMatched = user.password === hashedPassword;

    if (!isPasswordMatched) {
        return res.status(401).json({
            message: "Invalid email or password. Please check your credentials and try again."
        })
    }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, { expiresIn: "7d" })

    const refreshTokenHashed = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash: refreshTokenHashed,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id,
    }, config.JWT_SECRET, { expiresIn: "15m" })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    })

    return res.status(200).json({
        message: "Logged in successfully. Welcome back!",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
        accessToken
    })

}


export const getMe = async (req, res) => {
    const userId = req.user.id

    const user = await userModel.findById(userId)

    return res.status(200).json({
        message: "Authenticated user profile fetched successfully.",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        }
    })
}


export const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token is missing. Please log in again."
        })
    }

    try {
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

        const refreshTokenHashed = crypto.createHash("sha256").update(refreshToken).digest("hex")

        const session = await sessionModel.findOne({
            refreshTokenHash: refreshTokenHashed,
            revoked: false
        })

        if (!session) {
            return res.status(401).json({
                message: "Session not found or has been revoked. Please log in again."
            })
        }

        const accessToken = jwt.sign({
            id: decoded.id
        }, config.JWT_SECRET, { expiresIn: "15m" })

        const newRefreshToken = jwt.sign({
            id: decoded.id
        }, config.JWT_SECRET, { expiresIn: "7d" })

        const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex")

        session.refreshTokenHash = newRefreshTokenHash
        await session.save()

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 //7days
        })
        return res.status(200).json({
            message: "Access token refreshed successfully. New token issued.",
            accessToken
        })

    } catch (error) {
        return res.status(401).json({
            message: "Refresh token is invalid or has expired. Please log in again."
        })
    }


}


export const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "No active session found. You may already be logged out."
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.findOne({
        refreshTokenHash: refreshTokenHash,
        revoked: false
    })
    if (!session) {
        return res.status(401).json({
            message: "Session is invalid or has already been revoked."
        })
    }

    session.revoked = true
    await session.save()

    res.clearCookie("refreshToken")

    return res.status(200).json({
        message: "Logged out successfully. Your session has been terminated."
    })
}


export const logoutAll = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "No active session found. You may already be logged out from all devices."
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

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

}