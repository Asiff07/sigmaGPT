import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Chat from "../models/Chat.js";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// API TO REGISTER A NEW USER
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            // Status 409: Conflict (User already exists)
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        // Status 201: Created
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// API TO LOGIN A USER
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = generateToken(user._id);
            return res.json({ success: true, token });
        }
        // Status 401: Unauthorized (Wrong credentials)
        return res.status(401).json({ success: false, message: 'Invalid credentials' });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// API TO GET USER DETAILS
export const getUser = async (req, res) => {
    try {
        const user = req.user;
        if(!user) return res.status(404).json({ success: false, message: "User not found" });
        
        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// API TO GET PUBLISHED IMAGES
export const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            { $unwind: '$messages' },
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: '$messages.content',
                    userName: "$userName",
                }
            }
        ])
        res.json({ success: true, images: publishedImageMessages.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}