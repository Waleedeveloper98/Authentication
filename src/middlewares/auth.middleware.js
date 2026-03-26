import jwt from "jsonwebtoken"
import config from "../config/config.js"
import AppError from "../utils/AppError.js"

export const identifyUser = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Access token is missing. Please provide a valid Bearer token.", 401))
    }

    const token = authHeader.split(" ")[1]

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return next(new AppError("Access token is invalid or has expired. Please log in again.", 401))
    }
}
