import { googleLogin } from "@/app/api/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GoogleButton({ setIsLoading }) {
    const router = useRouter();
    // Handle google login
    const googleLoginHandler = async () => {
        const result = await googleLogin();
        if (result.success) {
            setIsLoading(true);
            router.push('/dashboard')
        };
    };

    return (
        <button
            className="google-button"
            type="button"
            onClick={googleLoginHandler}
        >
            <span className="flex flex-row gap-3 justify-center items-center">
                <Image
                    src="/google.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    className="max-w-[20px]"
                />
                Continue with Google
            </span>
        </button>
    )
};