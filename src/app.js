import express from "express"
import authRouter from "./routes/auth.routes.js"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import errorHandler from "./middlewares/errorHandler.js"

const app = express()

app.use(express.json())
app.use(morgan("dev"))
app.use(cookieParser())


app.use("/api/auth", authRouter)

// Global error handler — must be registered last
app.use(errorHandler)

export default app