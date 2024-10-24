
import { FaCode } from "react-icons/fa6";
import InputWithLabel from "../components/InputWithLabel";
import PrimaryBtn from "../components/PrimaryBtn";
import LinkBold from "../components/LinkBold";


export default function Register() {
    return (
      <>
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mx-auto h-12 w-auto">
              <FaCode className="mx-auto h-12 w-auto text-crimson-200"/>
            </div>
            <h2 className="mt-6 text-center text-4xl font-bold tracking-tight text-white">Register to get started!</h2>
          </div>
  
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-violet-300 py-8 px-4 ring-1 ring-crimson-400 sm:rounded-lg sm:px-10">
              <form className="space-y-6" action="#" method="POST">
                <InputWithLabel type='email' identifier='email' label="Email address" required={true} error=''/>
                <InputWithLabel type='password' identifier='password' label="Password" required={true} error=''/>
                <InputWithLabel type='password' identifier='conf-password' label="Confirm password" required={true} error=''/>
                <div className="text-sm">
                  <LinkBold label="You already have account?" location="/login"/>
                </div>
                <div>
                  <PrimaryBtn label="Register"/>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    )
  }
  