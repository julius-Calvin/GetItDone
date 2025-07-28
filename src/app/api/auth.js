
import { auth } from "./firebase-config";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    getAuth,
    sendPasswordResetEmail
} from "firebase/auth";

/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {object} - Success status and user data or error
 */

/* Register user */
export const registerUser = async (email, password) => {
    try {
        // Create new user account with firebase auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const actionCodeSettings = {
            url: `${process.env.NEXT_PUBLIC_LOCAL_URL}/auth/sign-in?email` + auth.currentUser.email,
            handleCodeInApp: true
        }; // Will direct to page again
        await sendEmailVerification(user, actionCodeSettings);

        return {
            success: true,
            user: user,
            emailVerificationSent: true
        }

    } catch (error) { // Handle error
        return {
            success: false,
            error: error.code
        }
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
        const actionCodeSettings = {
             url: `${process.env.NEXT_PUBLIC_LOCAL_URL}/auth/sign-in?email=` + email,
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