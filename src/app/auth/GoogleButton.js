import { googleLogin } from "@/app/api/auth";
import { useRouter } from "next/navigation";

export default function GoogleButton() {
    const router = useRouter();

    // Handle google login
    const googleLoginHandler = async () => {
        await googleLogin();
        router.push('/');
    };

    return (
        <button
            className="google-button"
            type="button"
            onClick={googleLoginHandler}
        >
            <span className="flex flex-row gap-3 justify-center items-center">
                <img
                    src="/google.svg"
                    className="max-w-[20px]"
                />
                Continue with Google
            </span>
        </button>
    )
};