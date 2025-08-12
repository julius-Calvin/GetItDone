'use client'

import Link from "next/link";
import LoadingPage from "@/app/loading-comp/LoadingPage";
import { registerUser } from "@/app/api/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GoogleButton from "../GoogleButton";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RegisterPage() {
    const [isLoading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State for data
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    // State for message
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Initializing router for redirect
    const router = useRouter();

    // Handle input change
    const handleInputChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        })
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Toggle confirm password visibility
    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // Error message cases
    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/weak-password':
                return 'Password is too weak';
            default:
                return 'Registration failed. Please try again.';
        }
    };

    const formSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
    const { email, username, password, confirmPassword } = formData

        // Check if fields are empty
        if (!email || !username || !password || !confirmPassword) {
            setError(`All fields are required`);
            return;
        };
        if (username.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }
        // Check if password length < 8
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        };
        // Validate if password == confirmPassword
        if (password !== confirmPassword) {
            setError("Password doesn't match");
            return;
        };

        setLoading(true);

        // register user
        try {
            const result = await registerUser(email, password, username);

            if (result.success && result.emailVerificationSent) {
                setMessage("Account successfully created! Check your email for email verification!")
                setTimeout(() => {
                    router.push('/auth/sign-in')
                }, 10000)
            } else {
                setError(getErrorMessage(result.error));
            }
        } catch (error) {
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingPage message={message} />
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-surface-alt dark:bg-[#121212] transition-theme px-4 py-8">
            <form onSubmit={formSubmit} className="w-full max-w-sm mx-auto">
                <div className="flex flex-col bg-surface dark:bg-[#1b1b1b] p-8 rounded-lg card-shadow gap-5 border border-base transition-theme">
                    <h1 className="text-center font-bold">WELCOME</h1>
                    {/* Alert to show message and error */}
                    {message && (
                        <div className="p-2 text-center rounded-lg text-white bg-green-600/80">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="p-2 text-center rounded-lg text-white bg-red-600/80">
                            {error}
                        </div>
                    )}
                    {/*Input fields*/}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                            <label>Username</label>
                            <input
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="input-fields"
                                placeholder="Choose a username"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label>Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="input-fields"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label>Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="input-fields w-full pr-10"
                                    placeholder="At least 8 characters"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label>Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="input-fields w-full pr-10"
                                    placeholder="Password must match"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={toggleConfirmPasswordVisibility}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
                                >
                                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/*Button Sign in and Google Sign in*/}
                    <div className="flex flex-col gap-2">
                        <button type="submit" className="button-bg">Register</button>
                        <p className="text-center">or</p>

                       {/* Google */}
                       <GoogleButton />

            <span className="gap-1 justify-center text-center text-sm flex flex-row ">
                            <p>Already have an account?</p>
                            <Link
                                className="text-sm hover:underline text-[#A23E48] cursor-pointer text-center"
                                href='/auth/sign-in'
                            >
                Sign in here
                            </Link>
                        </span>
                    </div>
                </div>
            </form>
        </div>
    )
}