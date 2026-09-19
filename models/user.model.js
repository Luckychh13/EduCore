import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from"crypto"

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Name is required'],
        lowercase:true,
        trim:true,
        maxLength:[50,'Name cannot exceed 50 characters'],
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        lowercase:true,
        unique:true,
        trim:true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Invalid email address"],
    },
    password:{
        type:String,
        required:[true,"Password is required for creating an account"],
        minlength:[8,"Password should contain more than 8 character"],
        select:false
    },
    role:{
        type:String,
        enum:{
            values:['student','instructor','admin'],
            message:'Please select a valid role'
        },
        default:'student'
    },
    avatar:{
        type:String,
        default:'default-avatar.png'
    },
    bio:{
        type:String,
        maxLength: [200, 'Bio cannot exceed 200 characters']
    },
    enrolledCourses: [{
        course:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Course'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdCourses : [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Course'
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
        type: Date,
        default: Date.now
    }
},
{
    timestamps:true,
    toJSON: { virtuals:true },
    toObject: { virtuals:true }
})


userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

userSchema.methods.comparePassword = async function(enterPassword){
    return await bcrypt.compare(enterPassword, this.password)
}

userSchema.methods.getResetPasswordToken = function(){
   const resetToken = crypto.randomBytes(20).toString('hex')
   this.resetPasswordToken = crypto 
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')
    this.resetPasswordExpire = Date.now() + 10*60*1000
    return resetToken
}

userSchema.methods.updateLastActive = function() {
    this.lastActive = Date.now()
    return this.lastActive({validateBeforeSave:false})
}

userSchema.virtual('totalEnrolledCourses').get(function(){
    return this.enrolledCourses.length
})

export const User = mongoose.model('User', userSchema)