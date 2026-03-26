import userModel from "../models/user.model.js"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import config from "../config/config.js"

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
            message: "User already exists"
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

    const accessToken = jwt.sign({
        id: user._id,
    }, config.JWT_SECRET, { expiresIn: "15m" })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    })

    return res.status(201).json({
        message: "User registered successfully",
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
            message: "Invalid credentials"
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")

    const isPasswordMatched = user.password === hashedPassword;

    if (!isPasswordMatched) {
        return res.status(401).json({
            message: "Invalid credentials"
        })
    }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, { expiresIn: "7d" })

    const accessToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, { expiresIn: "15m" })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secret: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    })

    return res.status(200).json({
        message: "User logged in successfully",
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
        message: "User fetched successfully",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        }
    })
}