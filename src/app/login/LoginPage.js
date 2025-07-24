export default function LoginPage () {
    return (
        <div className="flex items-center justify-center min-h-screen ">
            <form>
                <div className="flex flex-col bg-white p-10 rounded-lg card-shadow min-w-sm gap-5">
                    <h1 className="text-center font-bold">WELCOME BACK</h1>
                    
                    {/*Input fields*/}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                            <label>Email</label>
                            <input 
                            className="input-fields"
                            placeholder="Enter your email"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label>Email</label>
                            <input
                            className="input-fields" 
                            placeholder="At least 8 characters"
                            />
                        </div>
                        <a className="text-sm underline text-[#A23E48] cursor-pointer text-right">Forget Password?</a>
                    </div>

                    {/*Button Sign in and Google Sign in*/}
                    <div className="flex flex-col gap-2">
                        <button className="button-bg">
                            Sign in
                        </button>
                        <p className="text-center">or</p>
                        <button className="google-button">
                            <span className="flex flex-row gap-3 justify-center items-center">
                                <img 
                                src="google.svg"
                                className="max-w-[20px]"
                                />
                                Continue with Google
                            </span>
                        </button>
                       
                        <span className="gap-2 justify-center text-center text-sm flex flex-row "><p>Don't have an account?</p><a className="text-sm underline text-[#A23E48] cursor-pointer text-center">Register here</a></span>
                    </div>
                </div>
            </form>
        </div>
    )
}