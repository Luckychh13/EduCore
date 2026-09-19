import { ApiError, asyncHandler } from "../middleware/error.middleware.js"
import { User } from "../models/user.model.js"
import {generateToken} from "../utils/generateToken.js"
import { sendMail } from "../utils/mailService.js"


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

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, bio } = req.body;
  const updateData = { name, email: email?.toLowerCase(), bio };

  if (req.file) {
    const avatarResult = await uploadMedia(req.file.path);
    updateData.avatar = avatarResult?.secure_url || req.file.path;

    const user = await User.findById(req.id);
    if (user.avatar && user.avatar !== "default-avatar.png") {
      await deleteMediaFromCloudinary(user.avatar);
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new ApiError(404,"User not found");
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const changeUserPassword = asyncHandler(async(req,res) => {
  const {currentPassword,newPassword} = req.body

  const user = await User.findById(req.id).select('+password')
  if(!user){
    throw new ApiError(404,"User not found")
  }

  if(!await user.comparePassword(currentPassword)){
    throw new ApiError(401,"Current password is incorrect")
  }

  user.password = newPassword
  await user.save()

  res.status(200).json({
    success:true,
    message:"Password changed successfully"
  })
})

export const forgetPassword = asyncHandler(async(req,res) => {
  const {email} = req.body
  const user = await User.findOne({email:email.toLowerCase()}) 

  if(!user){
    throw new ApiError(404,"User not found with this email")
  }

  const resetToken = user.getResetPasswordToken()
  await user.save({validateBeforeSave:false})


  await sendMail(user.email,"Resest token",resetToken)

  res.status(200).json({
    success:true,
    message:'Password reset instructions sent to email'
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Get user by reset token
  const user = await User.findOne({
    resetPasswordToken: crypto.createHash("sha256").update(token).digest("hex"),
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError("Invalid or expired reset token", 400);
  }

  // Update password and clear reset token
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.id);

  // Delete avatar if not default
  if (user.avatar && user.avatar !== "default-avatar.png") {
    await deleteMediaFromCloudinary(user.avatar);
  }

  // Delete user
  await User.findByIdAndDelete(req.id);

  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});
