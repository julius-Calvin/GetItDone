'use client'

import { auth } from "@/app/api/firebase-config";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

export const Today = () => {
    const [userInfo, setUserInfo] = useState({
        displayName: '',
    })

    // Get user info
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUserInfo({
                    displayName: currentUser.displayName,
                });
            } else {
                setUserInfo({
                    displayName: '',
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex-1 bg-white">
            {/* Header Section */}
            <div className="w-full p-7 bg-white">
                <div className="flex flex-col gap-2">
                    <span className="text-4xl font-bold flex flex-row gap-2">
                        <h1>Hello,</h1>
                        <h1 className="text-[#A23E48]">
                            {userInfo.displayName ? userInfo.displayName.split(' ')[0] : ''}
                        </h1>
                    </span>
                    <h2 className="text-xl font-bold text-black/30">
                        Let's finish some things today!
                    </h2>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="p-4">
                <div className="flex flex-col items-center text-2xl font-bold gap-3">
                    <span className="flex gap-1">No <p className="text-[#A23E48]">Task</p> for today yet</span>
                    <button type="button" className="button-bg text-xl">
                        <span className="flex gap-2">
                            <img src="/dashboard/add-task.svg" />
                            Add today's task
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
};