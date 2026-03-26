import "dotenv/config"

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined")
}

if (!process.env.PORT) {
    throw new Error("PORT is not defined")
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT || 8000
}

export default config