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

export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    }
};


export const handleMongoError = (err) => {
    if (err.name === 'CastError') {
        return new ApiError(`Invalid ${err.path}: ${err.value}`, 400);
    }
    if (err.code === 11000) {
        const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
        return new ApiError(`Duplicate field value: ${value}. Please use another value!`, 400);
    }
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return new ApiError(`Invalid input data. ${errors.join('. ')}`, 400);
    }
    return err;
};

export const handleJWTError = () => 
    new ApiError('Invalid token. Please log in again!', 401);

export const handleJWTExpiredError = () => 
    new ApiError('Your token has expired! Please log in again.', 401);



