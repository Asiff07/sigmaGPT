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
            return res.json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
        });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};



// API TO LOGIN A USER

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = generateToken(user._id);
                return res.json({ success: true, token });
            }
        }
        return res.json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// API TO GET USER DETAILS
export const getUser = async (req, res) => {
    try {
        const user = req.user;
        return res.json({ success: true, user });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}


// api to get published images

export const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            { $unwind: '$messages' },
            {
                $match: {
                    "message.isImage": true,
                    "message.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: '$messages.content',
                    username: "$username",
                }
            }
        ])

        res.json({ success: true, images: publishedImageMessages.reverse() });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}