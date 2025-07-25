'use client'

import Link from "next/link"
import { useState } from 'react';
import { loginUser } from "@/app/api/auth";
import LoadingPage from "@/app/loading-comp/LoadingPage";
import { useRouter } from "next/navigation";

export default function ForgetPassword () {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter();

    // Form data state
    const [formData, setFormData] = useState({
        email: '',
    });

    // Handle input change
    const formDataChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        })
    };

    // Handle go to login

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
            return;
        };
        // Check if password length < 8
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        };

        try {
            const result = await loginUser(email, password);

            if(result.success) {
                setMessage("Signing in");
                window.location.href='/';
            } 
        } catch (error) {
            setError(error)

        } finally {
            setIsLoading(false);
        }
    };

    if(isLoading) {
        return <LoadingPage />
    }
    return (
        <div className="flex items-center justify-center min-h-screen ">
            <form onSubmit={formSubmit}>
                <div className="flex flex-col bg-white p-10 rounded-lg card-shadow min-w-sm gap-5">
                    <div className="flex flex-row">
                        <button 
                            onClick={() => router.push('/sign-in')}
                            type="button"
                        >
                            <img 
                                src="/back-button.svg"
                                className="max-w-[20px] hover:cursor-pointer hover:scale-110 transition all 300ms ease-in-out"
                            />
                        </button>
                        <div className="text-center w-full">
                            <h1 className="text-center font-bold">FORGET PASSWORD?</h1>
                        </div>
                    </div>
                    
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
                            value={formData.email}
                            onChange={formDataChange}
                            className="input-fields"
                            placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    {/*Button Sign in and Google Sign in*/}
                    <div className="flex flex-col gap-2">
                        <button className="button-bg">
                            Reset password
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}