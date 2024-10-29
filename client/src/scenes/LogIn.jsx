
import InputWithLabel from "../components/InputWithLabel";
import PrimaryBtn from "../components/PrimaryBtn";
import { request } from '../tools/requestModule';
import { useNavigate } from 'react-router-dom';
import { FaCode } from "react-icons/fa6";
import { useState } from "react";

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErr, setformErr] = useState(null);
  const navigate = useNavigate();


  function hondleSubmit(e) {
    e.preventDefault();
    const request_header = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    };
    console.log(request_header);
    request("/login", request_header).then((res) => {
      if (res.status === 200) {
        localStorage.setItem("_token", res.data.token);
        navigate('/');
      } else {
        setformErr(res.data.error);
      }
    });
  }

  return (
    <>
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto h-12 w-auto">
            <FaCode className="mx-auto h-12 w-auto text-crimson-200" />
          </div>
          <h2 className="mt-6 text-center text-4xl font-bold tracking-tight text-white">Log in!</h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-violet-300 py-8 px-4 ring-1 ring-crimson-400 sm:rounded-lg sm:px-10">
            <form className="space-y-6" action="#" method="POST">
              <InputWithLabel
                label='Email address'
                // type='email'
                identifier='email'
                value={email}
                setValue={setEmail}
              />
              <InputWithLabel
                label='Password'
                type='password'
                identifier='password'
                value={password}
                setValue={setPassword}
              />
              {/* Todo: forget password */}
              {/* <div className="flex items-center justify-between">
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
              </div> */}
              {formErr && <div className="bg-bluish-red bg-opacity-10 text-red-500 text-sm p-2 rounded-sm border border-red-600 hover:border-red-500">{formErr}</div>}
              <div>
                <PrimaryBtn label="Log in" action={hondleSubmit} />
              </div>
            </form>
            <div className="flex justify-center items-center gap-2 mt-6">
              <span className="text-center text-sm text-gray-200">Not a member?</span>
              <button className="font-semibold pt-1 text-crimson-100 hover:text-crimson-200 focus:ring-blue-100 focus:ring-1" onClick={() => navigate('/register')}>Create account</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
