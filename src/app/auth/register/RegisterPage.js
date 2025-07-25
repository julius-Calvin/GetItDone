'use client'

import Link from "next/link";
import LoadingPage from "@/app/loading-comp/LoadingPage";
import { registerUser } from "@/app/api/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GoogleButton from "../GoogleButton";

export default function RegisterPage() {
    const [isLoading, setLoading] = useState(false);

    // State for data
    const [formData, setFormData] = useState({
        email: '',
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
        const { email, password, confirmPassword } = formData

        // Check if fields are empty
        if (!email || !password || !confirmPassword) {
            setError(`All fields are required`);
            return;
        };
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
            const result = await registerUser(email, password);

            if (result.success && result.emailVerificationSent) {
                setMessage("Account successfully created!")
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
        <div className="flex items-center justify-center min-h-screen ">
            <form onSubmit={formSubmit}>
                <div className="flex flex-col bg-white p-10 rounded-lg card-shadow min-w-sm gap-5">
                    <h1 className="text-center font-bold">WELCOME</h1>
                    {/* Alert to show message and error */}
                    {message && (
                        <div className="p-2 text-center rounded-lg text-[white] bg-green-700/80">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="p-2 text-center rounded-lg text-[white] bg-red-700/80">
                            {error}
                        </div>
                    )}
                    {/*Input fields*/}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                            <label>Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="input-fields"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label>Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="input-fields"
                                placeholder="At least 8 characters"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="input-fields"
                                placeholder="Password must match"
                            />
                        </div>
                        <a
                            className="text-sm hover:underline text-[#A23E48] cursor-pointer text-right"
                        >
                            Forget Password?
                        </a>
                    </div>

                    {/*Button Sign in and Google Sign in*/}
                    <div className="flex flex-col gap-2">
                        <button type="submit" className="button-bg">
                            Register
                        </button>
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