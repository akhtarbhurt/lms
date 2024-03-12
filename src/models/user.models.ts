import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Define the interface for the User document
export interface IUser extends Document {
    username: string;
    email: string;
    phone: number;
    password: string;
    confirmPassword: string;
    refreshToken: string | undefined
    accessToken: string | undefined
    // Add any additional methods or properties here
    isPasswordCorrect(password: string): Promise<boolean>;
    generateRefreshToken() : any
    generateAccessToken() : any
    
}

// Define the Mongoose schema
const registrationSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
        unique: true,
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String
    },
    
});

// Define pre-save hook for hashing password
registrationSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Define method for checking password correctness
registrationSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};
// generate the access token
registrationSchema.methods.generateAccessToken = async function (): Promise<string | undefined> {
    try {
        console.log('Generating access token for user:', this._id, this.email, this.username);

        const accessToken =  jwt.sign(
            {
                _id: this._id,
                email: this.email,
                username: this.username
            },
            process.env.ACCESS_TOKEN_SECRET as string,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY as string
            }
        );

        
        return accessToken;
    } catch (error) {
        console.error('Error generating access token:', error);
        return undefined;
    }
};

//generate refresh token
registrationSchema.methods.generateRefreshToken = function(): string | undefined {
     const accessToken = jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY as string,
        }
    );
    console.log('Generated access token:', accessToken);
    return accessToken
}

const User: Model<IUser> = mongoose.model("User", registrationSchema);

export { User };
