import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true , lowercase: true, trim: true },
    hashedPassword: { type: String, required: true },
    displayName: { type: String, required: true, trim: true},
    avatarUrl :{ type: String, }, //link CDN to cover the image
    avatarId :{ type: String,  },// Cloudinary public id for image management
    bio: { type: String, maxLength: 500 },
    phone : { type: String, sparse : true} // sparse allows multiple null values but unique when provided
},{
    timestamps: true,
});

const User = mongoose.model("User", userSchema);
export default User;