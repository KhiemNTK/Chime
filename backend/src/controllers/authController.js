import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'
import cookie from 'cookie-parser'
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = "30m"; // 30 minutes
const REFRESH_TOKEN_TTL = 14*24*60*60*1000; // 14 day to milliseconds

export const signUp = async (req, res) =>{
    try{
    const {username, email, password, firstName, lastName}= req.body;
    if(!username || !email || !password || !firstName || !lastName){
        return res.status(400).json({message: "All fields are required"});
    }

    //check if user is exist
    const duplicateUser = await User.findOne({username});
    if(duplicateUser){
        return res.status(409).json({message: "Username already taken"});
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10); // salt =10

    //create new user
   await User.create({
    username, hashedPassword, email, displayName: `${firstName} ${lastName}`
   });

   //return 
   return res.sendStatus(204);
}catch(error){
        console.error("Error during user signup:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const signIn = async (req,res) =>{
    try{
        //get inputs from user
         const {username, password} = req.body;
        if(!username || !password){
            return res.status(400).json({message: "All fields are required"});
        }

        //get hashed password to compare with password input
        const user = await User.findOne({username});
        if(!user){
            return res.status(401).json({message: "Invalid username or password"})
        }
        //check password
        const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordMatch){
            return res.status(401).json({message: "Invalid username or password"})
        }
        //if password matches, create an accessToken with JWT
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
        //create refreshToken
        const refreshToken = crypto.randomBytes(64).toString('hex');
        //create new session to save refreshToken
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        })
        //return refreshToken into cookie
        res.cookie('refreshToken', refreshToken,{   
            httpOnly: true,//not accessible by js
            secure: true,//only sent over https
            sameSite: 'none',//backend and frontend are on different domains ( strict if opposite)
            maxAge: REFRESH_TOKEN_TTL,
        })
        //return accessToken in response
       return res.status(200).json({message:`User ${user.displayName} signed in successfully`, accessToken});

    }catch(error){
        console.error("Error during user signin:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
    
};

export const signOut = async (req, res) => {
    try{
        //get refreshToken from cookie
        const token = req.cookies?.refreshToken;
        if(token){
        //delete session from db
        await Session.deleteOne({refreshToken: token});
        //delete cookie from client
        res.clearCookie("refreshToken");
        }

    return res.sendStatus(204);

    }catch(error){
        console.error("Error during user signout:", error);
        return res.status(500).json({ message: "Internal server error" });
     } 
};