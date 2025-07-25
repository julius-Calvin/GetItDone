export default function LoadingPage ({message = "Loading"}) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A23E48]"></div>
                <p className="text-gray-600">{message}...</p>
            </div>
        </div>
    )
};