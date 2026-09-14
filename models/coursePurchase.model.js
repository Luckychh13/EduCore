const coursePurchaseSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: 'USD' },
    status: { type: String, enum: ['pending','completed','failed','refunded'], default: 'pending' },
    paymentMethod: { type: String, required: true }, 
    paymentId: { type: String, required: true },
    refundedId: { type: String },
    refundedAmount: { type: Number, min: 0 },
    refundReason: { type: String },
    metaData: { type: Map, of: String }
},{
    timestamps:true,
    toJSON: { virtuals:true },
    toObject: { virtuals:true }
})

coursePurchaseSchema.index({ user:1, course:1 })
coursePurchaseSchema.index({ status:1 })
coursePurchaseSchema.index({ createdAt:-1 })

coursePurchaseSchema.virtual('isRefundable').get(function(){
    if(this.status !== 'completed') return false
    const thirtyDayPeriod = new Date(Date.now() - 30*24*60*60*1000)
    return this.createdAt > thirtyDayPeriod
})

coursePurchaseSchema.methods.processRefund = async function (reason,amount){
    this.refundReason = reason
    this.status = 'refunded'
    this.refunded = true
    this.refundedAmount = amount || this.amount
    return this.save()
}
