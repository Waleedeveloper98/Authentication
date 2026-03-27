import jwt from "jsonwebtoken"
import crypto from "crypto"
import config from "../config/config.js"


export const generateTokens = (userId, sessionId = null) => {
    const accessToken = jwt.sign({
        id: userId,
        sessionId: sessionId,
    }, config.JWT_SECRET, { expiresIn: "15m" })

    const refreshToken = jwt.sign({
        id: userId,
    }, config.JWT_SECRET, { expiresIn: "7d" })

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

    return { accessToken, refreshToken, refreshTokenHash }
}