export class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
    ){
        super(message)
        this.statusCode=statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        
        Error.captureStackTrace(this,this.constructor)
        
    }
}

export const asyncHandler=(reqestHandler)=>{
    return (req,res,next)=>{
        Promise
        .resolve(reqestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}



