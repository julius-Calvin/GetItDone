'use client'

import { auth } from "./firebase-config";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    getAuth,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom Auth Hook
export const useAuth = () => useContext(AuthContext);

/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {object} - Success status and user data or error
 */

/* Register user */
export const registerUser = async (email, password, username, photoURL) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

        // Set initial profile (username + optional photo)
        try {
            await updateProfile(user, {
                displayName: username || email.split('@')[0],
                photoURL: photoURL || ''
            });
        } catch (e) {
            // Silently continue; profile update failure shouldn't block account creation
            console.warn('Profile update failed', e);
        }

    // Resolve base URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }
    // Ensure protocol + no trailing slash
    if (!/^https?:\/\//i.test(baseUrl)) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    const actionCodeSettings = {
      url: `${baseUrl}/auth/sign-in?email=${encodeURIComponent(auth.currentUser.email)}`,
      handleCodeInApp: true,
    };

    await sendEmailVerification(user, actionCodeSettings);

    return { success: true, user, emailVerificationSent: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
};

/**
 * Update current user's profile (displayName & photoURL)
 * @param {object} data { displayName?: string, photoURL?: string }
 */
export const updateUserProfile = async (data) => {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'auth/no-current-user' };
    try {
        await updateProfile(user, data);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.code };
    }
};

/**
 * Signing in a user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {object} - Success status and user data or error
 */

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        return {
            success: true,
            user: user
        }

    } catch (error) {
        return {
            success: false,
            error: error.code
        }
    }
};

/**
 * Signing out a user
 * @returns {object} - Success status and user data or error
 */

export const logoutUser = async () => {
    try {
        await signOut(auth);

        return {
            success: true,
            message: 'Successfully signed out'
        }
    } catch (error) {
        return {
            success: false,
            error: error.code,
            message: error.message
        }
    }
};

/**
 * Signing out a user
 * @returns {object} - Success status and user data or error
 */

export const googleLogin = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const auth = getAuth();
        const userCredential = await signInWithPopup(auth, provider);        
        const user = userCredential.user;

        return {
            success: true,
            message: 'Successfully sign in with Google ',
            uid: user.uid,
            email: user.email,
            username: user.email
        }
    } catch (error) {
        return {
            success: false,
            error: error.code
        }
    }
};

// Forget password

export const forgetPassword = async (email) => {
    try {
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
        const actionCodeSettings = {
            url: `${baseUrl}/auth/sign-in?email=${encodeURIComponent(email)}`,
            handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);

        return {
            success: true,
            message: 'Password reset email sent!',

        }
    } catch (error) {
        return {
            success: false,
            error: error.code,
            message: error.message
        }
    }
};