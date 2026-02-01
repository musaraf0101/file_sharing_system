import mongoose from "mongoose"

export const DBConnection = async() =>{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("db connected success...")
    } catch (error) {
        console.log(error.message)
        process.exit(1)
    }
}