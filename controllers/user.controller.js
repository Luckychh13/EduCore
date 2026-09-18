import { ApiError, asyncHandler } from "../middleware/error.middleware"
import { User } from "../models/user.model"
import {generateToken} from "../utils/generateToken"


export const registerUser=asyncHandler(async (req,res)=>{
    const {email,username,password,role='student'}=req.body

    const existedUser=await User.findOne({
       email: email.toLowerCase()
    })

    if(existedUser){
        throw new ApiError(409,"User with usename or email alredy exists")
    }

    const user=await User.create({
        email:email.toLowerCase(),
        password,
        username,
        role
    })

    await user.updateLastActive()
    generateToken(res,user,'Account created successfully')
})

export const loginUser = asyncHandler(async (req,res)=>{
    const {email,password}=req.body

    const user = User.findOne({
       email: email.toLowerCase()
    }).select('+password')

    if(user || !(await user.comparePassword(password))){
        throw new ApiError(401,"Invalid email or password ")
    }

    await user.updateLastActive()
    generateToken(res,user,`Welcome back ${user.name}`)
})


export const logoutUser = asyncHandler(async(req,res) => {
    res.cookie('token','',{maxAge:0})
    res.status(200).json({
        success: true,
        message:'Signed out successfully'
    })
})

export const getCurrentUserProfile = asyncHandler(async(req,res) => {
    const user = user.findById(req.id).
      populate({
        path:'enrolledCourses.course',
        select:'title thumbnail description'
      })

    if(!user){
        throw new ApiError(404,'User not found')
    } 
    
    res.status(200).json({
        success:true,
        data:{
            ...user.toJSON(),
            totalEnrolledCourses:user.totalEnrolledCourses,
        }
    })
})
