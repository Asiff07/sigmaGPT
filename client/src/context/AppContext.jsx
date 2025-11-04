import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChats, dummyUserData } from "../assets/assets";
import React from 'react';
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;


const AppContext = createContext()

export const AppContextProvider = ({ children }) => {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loadingUser, setLoadingUser] = useState(true);

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user/data', { headers: { Authorization: token } });
            if (data.success) {
                setUser(data.user);
            } else {
                toast.error(data.message);
                localStorage.removeItem('token');
                setToken(null);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
                console.warn('User not authenticated');
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoadingUser(false);
        }
    };



    const createNewChat = async () => {
        try {
            if (!user) {
                return toast.error("Login to create a new chat");
            }
            navigate('/');
            await axios.get('/api/chat/create', { headers: { Authorization: token } });
            await fetchUsersChat();
        } catch (error) {
            toast.error(error.message);
        }
    }


    const fetchUsersChat = async () => {
        try {
            const { data } = await axios.get('/api/chat/get', { headers: { Authorization: token } });
            if (data.success) {
                setChats(data.chats);
                //If user has no chats, create a new chat
                if (data.chats.length === 0) {
                    await createNewChat();
                    return fetchUsersChat();
                } else {
                    setSelectedChat(data.chats[0]);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(() => {
        if (user) {
            fetchUsersChat();
        } else {
            setChats([]);
            setSelectedChat(null);
        }
    }, [user])

    useEffect(() => {
        if (token) {
            fetchUser();
        }
        else {
            setUser(null);
            setLoadingUser(false);
        }
    }, [token])


    useEffect(() => {
        console.log("Theme changed:", theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme])

    const value = {
        navigate, user, setUser, chats, setChats,
        selectedChat, setSelectedChat,
        theme, setTheme, createNewChat, loadingUser, fetchUser, token, setToken, axios, fetchUsersChat
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext);