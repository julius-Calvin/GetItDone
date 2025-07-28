'use client'

import { auth } from "@/app/api/firebase-config"
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Sidebar ({ activeView, setActiveView }) {
    const [userInfo, setUserInfo] = useState({
        displayName: '',
        photoURL: ''
    })
    
    // Get current user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUserInfo({
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL
                });
            } else {
                setUserInfo({
                    displayName:'',
                    photoURL:''
                });
            }
        });
        
        return () => unsubscribe();
    }, []);

    return (
        <div className="flex flex-col min-h-screen items-center bg-[#F3F1F1]">
            <div className="p-2 w-full">
                {/* Profile Section*/}
                <div className="flex flex-row p-3 gap-3 items-center mb-6">
                    <div className="relative w-10 h-10">
                        <Image
                            src={userInfo.photoURL || '/dashboard/blank-user.svg'}
                            alt="Profile"
                            fill
                            className="rounded-full object-cover"
                            sizes="100px"
                        />
                    </div>
                    <p>{userInfo.displayName}</p>
                </div>

                {/* Navigation */}
                <div className="flex flex-col gap-1">
                    {/* Today task - Target icon */}
                    <div 
                        className={`flex flex-row gap-3 pl-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            activeView === 'today' ? 'sidebar-menu-active text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveView('today')}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            className="max-w-4"
                            fill="none"
                        >
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                            <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2.5" />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                        </svg>
                        <p className="font-bold">Today</p>
                    </div>

                    {/* Tomorrow - Calendar icon */}
                    <div 
                        className={`flex flex-row gap-3 pl-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            activeView === 'tomorrow' ? 'sidebar-menu-active text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveView('tomorrow')}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            className="max-w-4"
                            fill="none"
                        >
                            {/* Calendar body */}
                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                            />
                            {/* Calendar header */}
                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="4"
                                fill="currentColor"
                            />
                            {/* Calendar hooks/tabs */}
                            <line
                                x1="8"
                                y1="2"
                                x2="8"
                                y2="6"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            <line
                                x1="16"
                                y1="2"
                                x2="16"
                                y2="6"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            {/* Calendar dots/dates */}
                            <circle cx="8" cy="12" r="1" fill="currentColor" />
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                            <circle cx="16" cy="12" r="1" fill="currentColor" />
                            <circle cx="8" cy="16" r="1" fill="currentColor" />
                            <circle cx="12" cy="16" r="1" fill="currentColor" />
                            <circle cx="16" cy="16" r="1" fill="currentColor" />
                        </svg>
                        <p className="font-bold">Tomorrow</p>
                    </div>
                </div>
            </div>
        </div>
    )   
}