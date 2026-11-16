const mongoose = require('mongoose')
const dotenv = require('dotenv') 
dotenv.config()

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase"

console.log("Connecting to MongoDB at:", uri)
if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment variables.")
}

module.exports = () => {
    return mongoose.connect(uri)
}