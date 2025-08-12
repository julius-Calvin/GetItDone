'use client'

import { auth } from "@/app/api/firebase-config"
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser, updateUserProfile } from "@/app/api/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaSave, FaEdit } from 'react-icons/fa';

export default function Sidebar({ activeView, setActiveView, isLoading, setIsLoading }) {
    const [error, setError] = useState(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const router = useRouter();
    const [userInfo, setUserInfo] = useState({ displayName: '', photoURL: '' });
    // Dropdown removed; using direct edit icon
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ displayName: '' });
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');

    // Get current user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUserInfo({ displayName: currentUser.displayName, photoURL: '' });
                setIsLoading(false);
            } else {
                // Only redirect if we're not already in the process of signing out
                if (!isSigningOut) {
                    setUserInfo({ displayName: '', photoURL: '' });
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

    const openEdit = () => {
    setEditData({ displayName: userInfo.displayName || '' });
    setShowEditModal(true);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setUpdateError('');
        setUpdateSuccess('');
    let { displayName } = editData;
        const startTs = Date.now();
        console.log('[ProfileUpdate] Started', { displayNameInitial: displayName });
        // Fallback safety: force clear after 20s no matter what
        const safetyTimer = setTimeout(()=> {
            console.warn('[ProfileUpdate] Safety timer triggered; forcing updating=false');
            setUpdating(false);
        }, 20000);
        try {
            console.log('[ProfileUpdate] Calling updateUserProfile');
            // Add a 12s timeout around profile update to avoid indefinite hanging
            const result = await Promise.race([
        updateUserProfile({ displayName: displayName || null, photoURL: null }),
                new Promise((_, reject)=> setTimeout(()=> reject(new Error('Profile update timed out')), 12000))
            ]);
            console.log('[ProfileUpdate] updateUserProfile result', result);
            if (result.success) {
        setUserInfo({ displayName, photoURL: '' });
                try { auth.currentUser?.reload?.(); } catch(e) { /* ignore */ }
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('profile-updated', { detail: { displayName } }));
                }
                setUpdateSuccess('Profile updated');
                setTimeout(()=> setShowEditModal(false), 800);
            } else {
                setUpdateError(result.error || 'Update failed');
            }
        } catch (err) {
            console.error('[ProfileUpdate] Error', err);
            setUpdateError(err.message || 'Upload failed');
        } finally {
            clearTimeout(safetyTimer);
            console.log('[ProfileUpdate] Finished in', Date.now() - startTs, 'ms');
            setUpdating(false);
        }
    };

    return (
    <div className="flex flex-col min-h-screen items-center bg-[#F3F1F1] relative w-60 md:w-64 flex-shrink-0">
            <div className="p-2 min-w-7 flex flex-col h-full w-full">
                {/* Profile Section*/}
                <div className="flex flex-row p-3 items-center mb-6 relative w-full gap-3">
                    <div className="relative w-6 h-6 shrink-0">
                        <Image
                            src={'/dashboard/blank-user.svg'}
                            alt="Profile"
                            fill
                            className="rounded-full object-cover"
                            sizes="24px"
                        />
                    </div>
                    <span className="font-bold select-none text-sm md:text-base truncate" title={userInfo.displayName || 'No Username'}>
                        {isLoading ? 'Fetching username.....' : (userInfo.displayName || 'No Username')}
                    </span>
                    <button
                        type="button"
                        aria-label="Edit username"
                        onClick={openEdit}
                        className="ml-auto p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
                    >
                        <FaEdit size={14} />
                    </button>
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
                
                {/* Sign Out Button - fallback if dropdown hidden */}
                <div className="mt-auto mb-6 w-full px-3 hidden md:block">
                    <button
                        onClick={signOutUser}
                        className="text-[#F3F1F1] font-bold button-bg p-3 text-lg cursor-pointer rounded-lg w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </div>
            {/* Edit Modal (center of viewport) */}
            {showEditModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm flex flex-col gap-4">
                        <h2 className="font-bold text-lg">Edit Profile</h2>
                        {updateError && <div className="text-sm text-red-600 bg-red-100 p-2 rounded">{updateError}</div>}
                        {updateSuccess && <div className="text-sm text-green-600 bg-green-100 p-2 rounded">{updateSuccess}</div>}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold">Username</label>
                            <input
                                type="text"
                                className="input-fields"
                                value={editData.displayName}
                                minLength={3}
                                onChange={e=> setEditData({...editData, displayName: e.target.value})}
                                placeholder="Your username"
                                required
                            />
                        </div>
                        {/* Photo upload removed */}
                        <div className="flex gap-3 justify-end">
                            <button type="button" className="hover:cursor-pointer hover:scale-105 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded bg-gray-200 hover:bg-gray-300 w-28" onClick={()=> setShowEditModal(false)} disabled={updating}>Cancel</button>
                            <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded button-bg text-white disabled:opacity-70 w-28" disabled={updating}>
                                {updating ? 'Saving...' : <><FaSave className="text-white" size={14}/> Save</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}