import type { Request, Response } from 'express';
const userModel = require('../models/user.model'); // Adjust path as needed

interface UserData {
    userName: string;
    email: string;
    password?: string;
    bio: string;
    profilePicture: string;
    followers: number;
    following: number;
    name: string;
    dms: string[];
    matchingTime: Record<string, number>;
}

// 1. Add 'export' and change parameters to (req: Request, res: Response)
export async function makeUser(req: Request, res: Response) {
    // 2. You can eventually replace this hardcoded data with: const userData = req.body;
    const userData: UserData = {
        userName: 'divyanshk2906',
        email: 'dk@gmail.com',
        password: '123456',
        bio: '!! Ram Ram Ram !!',
        profilePicture: 'https://example.com/profile.jpg',
        followers: 69,
        following: 67,
        name: 'DK',
        dms: ['Gauri123', 'Garvit123', 'KrishChoudhary123'],
        matchingTime: {
            'Garvit123': 30, 
            'Gauri123': 45,
            'KrishChoudhary123': 60
        }
    }
    
    try {
        await userModel.create(userData);
        console.log("User Has Been Created Successfully !");
        return res.status(201).json({ message: "User Created Successfully !" });
    } catch (err: any) {
        console.log("User not created ...", err.message);
        return res.status(500).json({ message: "Internal Server Error --- /register" });
    }
}