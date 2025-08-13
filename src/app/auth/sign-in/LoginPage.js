'use client'

import Link from "next/link"
import Image from "next/image";
import { useState } from 'react';
import { loginUser } from "@/app/api/auth";
import LoadingPage from "@/app/loading-comp/LoadingPage";
import { useRouter } from "next/navigation";
import GoogleButton from "../GoogleButton";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage () {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    // Form data state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Handle input change
    const formDataChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        })
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Go to forget password
    const goToForgetPassword = () => {
        setIsLoading(true);
        router.push('/auth/forget-password');
    };

    // Go to home page
    const goToHome = () => {
        setIsLoading(true);
        router.push('/');
    };
    // Handle form submit
    const formSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setIsLoading(true);
        const { email, password } = formData;

        // Validation
        if (!email || !password) {
            setError(`All fields are required`);
            setIsLoading(false);
            return;
        };
        // Check if password length < 8
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        };

        try {
            const result = await loginUser(email, password);

            if(result.success) {
                setMessage("Signing in");
                window.location.href='/dashboard';
            } else {
                setError(result.error || "Login failed");
            }
        } catch (error) {
            setError(error?.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if(isLoading) {
        return <LoadingPage />
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-surface-alt dark:bg-[#121212] transition-theme px-4 py-8">
            <form onSubmit={formSubmit} className="w-full max-w-sm mx-auto">
                <div className="flex flex-col bg-surface dark:bg-[#1b1b1b] p-8 rounded-lg card-shadow gap-5 border border-base transition-theme">
                    <div className="flex flex-row">
                        <button type="button" onClick={goToHome} className="hover:cursor-pointer hover:scale-105 transition duration-300 ease-in-out"><Image src="/back-button.svg" alt="Back" width={20} height={20} className="w-5" /></button>
                        <span className="flex text-center w-full"><h1 className="font-bold w-full text-foreground">WELCOME BACK</h1></span>
                    </div>
                    
                    {/* Alert to show message and error */}
                    {message && (
                        <div className="p-2 text-center rounded-lg text-white bg-green-600/80 dark:bg-green-700/80">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="p-2 text-center rounded-lg text-white bg-red-600/80 dark:bg-red-700/80">
                            {error}
                        </div>
                    )}
                    {/*Input fields*/}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                            <label className="text-foreground">Email</label>
                            <input 
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={formDataChange}
                                className="input-fields"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-foreground">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={formDataChange}
                                    className="input-fields w-full pr-10" 
                                    placeholder="At least 8 characters"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={goToForgetPassword}
                            className="text-sm hover:underline text-[#A23E48] cursor-pointer text-right"
                        >
                            Forget Password?
                        </button>
                    </div>

                    {/*Button Sign in and Google Sign in*/}
                    <div className="flex flex-col gap-2">
                        <button type="submit" className="button-bg">
                            Sign in
                        </button>
                        <p className="text-center text-foreground">or</p>
                        
                        {/* Google */}
                        <GoogleButton setIsLoading={setIsLoading} />
                       
            <span className="gap-1 justify-center text-center text-sm flex flex-row ">
                            <p className="text-foreground">Don&apos;t have an account?</p>
                            <Link
                                className="text-sm hover:underline text-[#A23E48] cursor-pointer text-center"
                                href="/auth/register"
                            >
                Register here
                            </Link>
                        </span>
                    </div>
                </div>
            </form>
        </div>
    )
}