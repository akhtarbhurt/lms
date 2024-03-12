import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/user.models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { error } from 'console';

// Interface for the request body in userRegistration handler
interface UserRegistrationRequestBody {
    username: string;
    email: string;
    phone: number;
    password: string;
}

// Interface for the request body in userLogin handler
interface UserLoginRequestBody {
    email: string;
    password: string;
}

// Custom Request interface that extends the Express.Request interface
interface CustomRequest extends Request {
    user?: IUser;
}

// Handler to generate refresh and access tokens
const generateAccessAndRefreshTokens = async (userId: any) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        
        const accessToken = await user?.generateAccessToken();
        const refreshToken = user?.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user?.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating refresh and access token');
    }
};

// Register user handler
const userRegistration = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { username, email, phone, password }: UserRegistrationRequestBody = req.body;

    // Check whether the user exists or not
    const existUser = await User.findOne({  email });
    const existPhone = await User.findOne({phone})

    if (existUser) {
        return res.status(400).json({error: "Email aready exists. Try different one"})
    }

    if(existPhone){
        return res.status(400).json({error: "This phone number already exists"})
    }

    // Create the user
    const payload = await User.create({
        username,
        email,
        phone,
        password,
    });  
    return res.status(200).json(new ApiResponse(200, payload, 'User created successfully'));
});

// User login handler
const userLogin = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { email, password }: UserLoginRequestBody = req.body;
    
    if (!(password || email)) {
        throw new ApiError(400, "Invalid credentials");
    }

    const user = await User.findOne({
        email
    });

    if (!user) {
        return res.status(400).json({error: "Email does not exist"})
    }

     const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return res.status(400).json({error: " Invalid user credentials "})
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    console.log('Generated access login token:', accessToken);

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'User logged In Successfully'
            )
        );
});

// Logout the user handler
const logoutUser = asyncHandler(async(req : CustomRequest, res) => {
    await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

export { userRegistration, userLogin, logoutUser };
