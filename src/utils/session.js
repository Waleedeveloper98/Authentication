import sessionModel from "../models/session.model.js"

const createSession = async (userId, refreshTokenHash, req) => {
    const session = await sessionModel.create({
        user: userId,
        refreshTokenHash: refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    })

    return session
}

export default createSession