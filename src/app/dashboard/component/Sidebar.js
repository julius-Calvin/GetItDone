'use client'

import { auth } from "@/app/api/firebase-config"
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser } from "@/app/api/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Sidebar({ activeView, setActiveView, isLoading, setIsLoading }) {
    const [error, setError] = useState(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const router = useRouter();
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
                setIsLoading(false);
            } else {
                // Only redirect if we're not already in the process of signing out
                if (!isSigningOut) {
                    setUserInfo({
                        displayName: '',
                        photoURL: ''
                    });
                    router.push('/auth/sign-in');
                }
            }
        });

        return () => unsubscribe();
    }, [isSigningOut]);

    const signOutUser = async (event) => {
        event.preventDefault();
        setError(null); // Clear any previous errors
        setIsSigningOut(true);
        setIsLoading(true); 
        try {
            const result = await logoutUser();
            // Handle case when logout fails
            if (!result.success) {
                setError(result.message);
                setIsLoading(false);
                setIsSigningOut(false);
            } else {
                // Successful logout - redirect to sign-in page
                router.push('/auth/sign-in');
            }
        } catch (error) {
            setError(error?.message || "An error occurred");
            setIsLoading(false);
            setIsSigningOut(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center bg-[#F3F1F1]">
            <div className="p-2 min-w-7 flex flex-col h-full w-full">
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
                    <p className="font-bold"> {isLoading ? <span>Fetching username.....</span> : userInfo.displayName}</p>
                </div>

                {/* Navigation */}
                <div className="flex flex-col gap-1 flex-grow">
                    {/* Today task - Target icon */}
                    <div
                        className={`flex flex-row gap-3 pl-3 py-2 rounded-lg cursor-pointer transition-colors ${activeView === 'today' ? 'sidebar-menu-active text-white' : 'hover:bg-gray-100'
                            }`}
                        onClick={() => {
                            setActiveView('today')
                        }}
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
                        className={`flex flex-row gap-3 pl-3 py-2 rounded-lg cursor-pointer transition-colors ${activeView === 'tomorrow' ? 'sidebar-menu-active text-white' : 'hover:bg-gray-100'
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
                
                {/* Error Display */}
                {error && (
                    <div className="mt-2 mb-4 w-full px-3">
                        <div className="p-2 text-center rounded-lg text-white bg-red-600 text-sm">
                            {error}
                        </div>
                    </div>
                )}
                
                {/* Sign Out Button - Now at bottom */}
                <div className="mt-auto mb-6 w-full px-3">
                    <button
                        onClick={signOutUser}
                        className="text-[#F3F1F1] font-bold button-bg p-3 text-lg cursor-pointer rounded-lg w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </div>
        </div>
    )
}