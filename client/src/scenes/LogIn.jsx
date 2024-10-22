
import { FaCode } from "react-icons/fa6";
import InputWithLabel from "../components/InputWithLabel";
import PrimaryBtn from "../components/PrimaryBtn";

export default function LogIn() {
    return (
      <>
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mx-auto h-12 w-auto">
              <FaCode className="mx-auto h-12 w-auto text-crimson-200"/>
            </div>
            <h2 className="mt-6 text-center text-4xl font-bold tracking-tight text-white">Log in!</h2>
          </div>
  
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-violet-300 py-8 px-4 ring-1 ring-crimson-400 sm:rounded-lg sm:px-10">
              <form className="space-y-6" action="#" method="POST">
                <InputWithLabel label="Email address" type="email" identifier="email" />
                <InputWithLabel label="Password" type="password" identifier="password" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-crimson-200 text-crimson-200 focus:outline-none focus:ring-1 focus:ring-ring-offset-4 focus:ring-blue-100"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                      Remember me
                    </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-medium text-crimson-200 hover:text-crimson-100 focus:outline-none focus:ring-blue-100 focus:ring-1">
                      Forgot your password?
                    </a>
                  </div>
                </div>
                <div>
                  <PrimaryBtn label="Log in" />
                </div>
              </form>
                <div className="flex justify-center items-center gap-2 mt-6">
                  <span className="text-center text-sm text-gray-200">Not a member?</span>
                  <a href="register" className="font-semibold text-crimson-100 hover:text-crimson-200">Create account</a>
                </div>
            </div>
          </div>
        </div>
      </>
    )
  }
  