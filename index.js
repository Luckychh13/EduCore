import express from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import mongoSanitize from "express-mongo-sanitize"
import hpp from "hpp"
import {xss} from "express-xss-sanitizer"
import cookieParser from "cookie-parser"
import cors from "cors"
import healthRoute from './routes/health.routes.js'
import userRoute from './routes/user.routes.js'
import razopayRoute from './routes/razorpay.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT

//Rate-limiting
const limiter = rateLimit({
    windowMs:15*60*1000,
    limit:100,
    message:"Too many reuest, please try later"
})

// Security
app.use(helmet())
app.use(mongoSanitize())
app.use(hpp())
app.use(xss())
app.use("/api",limiter)

//logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

//Parser Middleware
app.use(express.json({limit:"10kb"}))
app.use(express.urlencoded({extended: true, limit:"10kb"}))
app.use(cookieParser())

//Cors congig
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true,
    methods:['GET','PUT','DELETE','PATCH','HEAD','OPTIONS'],
    allowedHeaders:[
        "Content-Type",
        "Authorization",
        "Origin",
        "X-Requested-With",
        "Accept",
        "device-remember-token",
    ]
}))

//API Routes
app.use('/health', healthRoute)
app.use('/api/v1/user',userRoute)
app.use('/api/v1/razorpay',razopayRoute)

//404
app.use((req,res) => {
    res.status(404).json({status:"error",message:"Route not found"})
})

//Global Error
app.use((err,req,res,next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status:"error",
        message:err.message || "Internal server error",
        ...(process.env.NODE_ENV === 'development' && {stack:err.stack}),
    })
})

app.listen(PORT,() => {
    console.log(`Server is running at ${PORT} in ${process.env.NODE_ENV}`);
    
})

