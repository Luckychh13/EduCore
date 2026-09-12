import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"

dotenv.config()

const app = express()
const PORT = process.env.PORT

//logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

//Parser Middleware
app.use(express.json({limit:"10kb"}))
app.use(express.urlencoded({extended: true, limit:"10kb"}))

//Global Error
app.use((err,req,res,next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status:"error",
        message:err.message || "Internal server error",
        ...(process.env.NODE_ENV === 'development' && {stack:err.stack}),
    })
})

//404
app.use((req,res) => {
    res.status(404).json({status:"error",message:"Route not found"})
})

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT} in ${process.env.NODE_ENV}`);
    
})

