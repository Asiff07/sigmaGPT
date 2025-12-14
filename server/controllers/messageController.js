//TextBased AI Chat Message Controller

import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imagekit from "../configs/imagekit.js";
import openai from "../configs/openai.js";

export const textMessageController = async (req, res) => {
    try {
        const  userId  = req.user._id;
        if (req.user.credits < 1) {
            return res.json({ success: false, message: 'Not enough credits' });
        }
        const { chatId, prompt } = req.body;

        const chat = await Chat.findOne({ _id: chatId, userId });
        chat.messages.push({ role: 'user', content: prompt, timestamp: Date.now(), isImage: false });

        const { choices } = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = { ...choices[0].message, timestamp: Date.now(), isImage: false };

        res.json({ success: true, reply });

        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });


    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

//Image Generation Controller

export const imageMessageController = async (req, res) => {
    try {
        const userId  = req.user._id;
        if (req.user.credits < 2) {
            return res.json({ success: false, message: 'Not enough credits' });
        }
        const { chatId, prompt, isPublished } = req.body;
        //Find the chat
        const chat = await Chat.findOne({ _id: chatId, userId });
        //push user message to chat
        chat.messages.push({ role: 'user', content: prompt, timestamp: Date.now(), isImage: false });

        //Encode the prompt to base64
        const encodedPrompt = encodeURIComponent(prompt);

        //Construct ImageKit AI Generation URL
        const generatedImageKitURL = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/sigmagpt/${Date.now()}.png?tr=w-800,h-800`;

        // Trigger generation by fetching from Imagekit
        const aiImageResponse = await axios.get(generatedImageKitURL, { responseType: 'arraybuffer' });

        //Convert to base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, 'binary').toString('base64')}`;

        // Upload to Imagekit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "sigmagpt"
        })
        const reply = { role: 'assistant', content: uploadResponse.url, timestamp: Date.now(), isImage: true, isPublished };
        res.json({ success: true, reply });

        //Push assistant reply to chat
        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}