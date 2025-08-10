'use client'

import LoadingPage from "./loading-comp/LoadingPage";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./api/firebase-config";
import { logoutUser } from "./api/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [error, setError] = useState("")

  const router = useRouter();

  // Check if already signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Sign in button handler
  const goToSignIn = () => {
    setIsLoading(true)
    router.push('/auth/sign-in')
  };

  // Sign out button handler
  const signOutUser = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await logoutUser();

      if (result && result.success) {
        // Let onAuthStateChanged handle the redirect automatically
      } else {
        // Handle case when logout fails
        setError(result?.message || "Failed to sign out");
        setIsLoading(false);
      }

    } catch (error) {
      setError(error?.message || "An error occurred");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 bg-gradient-to-b">
      <main className="row-start-2 w-full max-w-2xl">
        {/* Alert to show error */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 w-full rounded-xl border border-red-300/50 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 p-3 text-sm shadow-sm"
          >
            {error}
          </div>
        )}

        <section className="card-shadow relative w-full rounded-2xl b dark:bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-8 sm:p-10 flex flex-col items-center gap-8 text-center ">
          <div>
            <Image
              src="/logo.png"
              alt="Get It Done logo"
              width={120}
              height={120}
              priority
              className="rounded-xl shadow-sm"
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Get It <span className="bg-gradient-to-r from-[#A23E48] via-[#A23E48]/90 to-[#A23E48]/80 bg-clip-text text-transparent">Done</span>
            </h1>
            <p className="mx-auto max-w-prose text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
              A minimalist to-do list website with an integrated Pomodoro timer to help you stay focused, organized, and productive.
            </p>
          </div>

          {!isSignedIn && (
            <div className="w-full flex justify-center">
              <button
                onClick={goToSignIn}
                className="button-bg text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500 disabled:opacity-60 transition w-full sm:w-auto"
                disabled={isLoading}
              >
                Get Started
              </button>
            </div>
          )}

          {isSignedIn && (
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                onClick={signOutUser}
                className="px-6 py-3 rounded-xl border border-neutral-300/60 dark:border-neutral-700/80 bg-white/60 dark:bg-neutral-900/50 hover:bg-white/90 dark:hover:bg-neutral-800/70 text-neutral-700 dark:text-neutral-200 shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400 disabled:opacity-60 transition w-full sm:w-auto"
                disabled={isLoading}
              >
                Sign out
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard');
                  setIsLoading(true);
                }}
                className="button-bg text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500 disabled:opacity-60 transition w-full sm:w-auto"
                disabled={isLoading}
              >
                Dashboard
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
