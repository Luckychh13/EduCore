import { ApiError, asyncHandler } from "./error.middleware";
import jwt from 'jsonwebtoken'

export const isAuthenticated = asyncHandler(async(req,res,next) => {
   const token = req.cookies.token

   if(!token){
    throw new ApiError(401,'You are not logged in')
   }

   try {
    const decoded = jwt.verify(token,process.env.SECRET_KEY)
    req.id = decoded.userId;
    next()

   } catch (error) {
    throw new ApiError(401,"Invalid access token")
   }
    
    
})