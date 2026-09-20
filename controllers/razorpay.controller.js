import Razorpay from 'razorpay'
import { ApiError, asyncHandler } from '../middleware/error.middleware.js';
import {Course} from "../models/course.model.js"
import {CoursePurchase} from "../models/coursePurchase.model.js"
import crypto from "crypto"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET ,
});

export const createRazorpayOrder = asyncHandler(async(req,res) => {

    const userId = req.key_id
    const {courseId} = req.body

    const course = await Course.findById(courseId)
    if(!course){
       throw new ApiError(404,'Course not found')
    }

    const newPurchase = new CoursePurchase({
        course: courseId,
        user: userId,
        amount: course.price,
        status: 'pending',
        paymentMethod: 'razorpay'
    })

    const options = {
        amount: course.price*100,
        currency:'INR',
        receipt: `course_${courseId}`,
        note: {
            courseId: courseId,
            userId:userId
        }
    }

    const order = await razorpay.orders.create(options)

    newPurchase.paymentId = order.id
    await newPurchase.save()

    res.status(200).json({
        success:true,
        order,
        course:{
            name:course.title,
            description:course.description,
            image:course.thumbnail
        }
    })
})

export const verifyRazorpayPayment = asyncHandler(async(req,res) => {
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expexctedSignature = crypto 
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expexctedSignature ===  razorpay_signature
    if(!isAuthentic){
        throw new ApiError(404,"Payment verification failed")
    }

    const purchase = await CoursePurchase.findOne({
        paymentId: razorpay_order_id
    })
    if(!purchase){
        throw new ApiError(404,"Purchase record not found")
    }

    purchase.status = 'completed'
    await purchase.save()

    res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        courseId: purchase.courseId
    })
})
