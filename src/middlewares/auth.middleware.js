import jwt from "jsonwebtoken"
import config from "../config/config.js"

const identifyUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(400).json({
            message: "Unauthorized token not found"
        })
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(400).json({
            message: "Invalid user"
        })
    }

}

export default identifyUser