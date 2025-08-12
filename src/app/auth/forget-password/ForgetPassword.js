'use client'

import { useState } from 'react';
import Image from 'next/image';
import LoadingPage from "@/app/loading-comp/LoadingPage";
import { forgetPassword } from '@/app/api/auth';
import { useRouter } from "next/navigation";

export default function ForgetPassword () {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter();

    // Form data state
    const [email, setEmail] = useState("");

    // Handle input change
    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    // Handle go to login
    const backToLogin = () => {
        router.push('/auth/sign-in');
    };

    // Handle form submit
    const formSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setEmail("")
        setIsLoading(true);

        // Validation
        if (!email) {
            setError(`All fields are required`);
            setIsLoading(false);
            return;
        }

        try {
            const result = await forgetPassword(email);

            if(result && result.success) {
                setMessage(result.message);
            } else {
                setError(result?.message || "Failed to send reset email");
            }
        } catch (error) {
            console.error("API Error:", error);
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
                <div className="flex flex-col bg-surface dark:bg-[#1b1b1b] p-8 rounded-lg card-shadow min-w-sm gap-5 border border-base transition-theme">
                    <div className="flex flex-row">
                        <button 
                            onClick={backToLogin}
                            type="button"
                        >
                            <Image 
                                src="/back-button.svg"
                                alt="Back"
                                width={20}
                                height={20}
                                className="max-w-[20px] hover:cursor-pointer hover:scale-110 transition all 300ms ease-in-out"
                            />
                        </button>
                        <div className="text-center w-full">
                            <h1 className="text-center font-bold">FORGET PASSWORD?</h1>
                        </div>
                    </div>
                    
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
                            <label>Email</label>
                            <input 
                            type='email'
                            name="email"
                            value={email}
                            onChange={handleEmailChange}
                            className="input-fields"
                            placeholder="Enter your email"
                            required
                            />
                        </div>
                    </div>

                    {/*Button to reset password*/}
                    <div className="flex flex-col gap-2">
                        <button 
                            type='submit'
                            className="button-bg"
                        >
                            Reset password
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}