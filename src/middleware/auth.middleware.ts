import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/user.models';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import jwt from 'jsonwebtoken';

// Custom Request interface that extends the Express.Request interface
interface CustomRequest extends Request {
    user?: IUser;
}

// Middleware to verify JWT
export const verifyJWT = asyncHandler(async (req: CustomRequest, _: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
       
        if (!token) {
            throw new ApiError(401, 'Unauthorized request');
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);

        const user = await User.findById((decodedToken as { _id: string })._id).select('-password -refreshToken');

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error : any ) {
        next(error)
        throw new ApiError(401, error?.message || "not valid");
    }
});
