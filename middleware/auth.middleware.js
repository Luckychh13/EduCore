import { ApiError, asyncHandler } from "./error.middleware.js";
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
    if (error.name === "JsonWebTokenError") {
          throw new ApiError("Invalid token. Please log in again.", 401);
        }
        if (error.name === "TokenExpiredError") {
          throw new ApiError("Your token has expired. Please log in again.", 401);
        }
        throw error;
   } 
})

export const restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403
      );
    }
    next();
  });
}