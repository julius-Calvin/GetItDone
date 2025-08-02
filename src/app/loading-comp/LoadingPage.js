'use client'

export default function LoadingPage({  message = "Loading", useFullScreen = true }) {
    return (
        <div className={`${useFullScreen && "min-h-screen"} flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A23E48]"></div>
                <p className="text-gray-600">{message}...</p>
            </div>
        </div>
    )
};