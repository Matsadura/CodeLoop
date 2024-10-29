
import { FaCode } from "react-icons/fa6";
import InputWithLabel from "../components/InputWithLabel";
import PrimaryBtn from "../components/PrimaryBtn";
import LinkBold from "../components/LinkBold";
import { useState } from "react";
import { request } from '../tools/requestModule';
import { useNavigate } from 'react-router-dom';


export default function Register() {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfErr, setPasswordConfErr] = useState('');
  // Errors
  const [passwordErr, setPasswordErr] = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [formErr, setformErr] = useState(null);
  // redirect
  const navigate = useNavigate();

  useNavigate('/login');
  function handleSubmit(e) {
    setformErr(null);
    e.preventDefault();
    if (password !== passwordConf) {
      setPasswordErr('the password confirmation does not match');
      setPasswordConfErr('the password confirmation does not match');
      return;
    } else {
      setPasswordErr('');
      setPasswordConfErr('');
    }
    const requestHeader = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: fname,
        last_name: lname,
        email,
        password,
      }),
    };
    request("/register", requestHeader).then((res) => {
      if (res.status === 201) {
        console.log(res);
        navigate('/login');
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
          <h2 className="mt-6 text-center text-4xl font-bold tracking-tight text-white">Register to get started!</h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-violet-300 py-8 px-4 ring-1 ring-crimson-400 sm:rounded-lg sm:px-10">
            <form className="space-y-6">
              <div className="flex gap-4">
                <InputWithLabel
                  // type='email'
                  identifier='first_name'
                  label="First Name"
                  required={false}
                  value={fname}
                  setValue={setFname}
                  error=''
                />
                <InputWithLabel
                  // type='email'
                  identifier='last_name'
                  label="Last Name"
                  required={false}
                  value={lname}
                  setValue={setLname}
                  error=''
                />
              </div>
              <InputWithLabel
                // type='email'
                identifier='email'
                label="Email address"
                required={false}
                value={email}
                setValue={setEmail}
                error=''
              />
              <InputWithLabel
                type='password'
                identifier='password'
                label="Password"
                required={false}
                error={passwordErr}
                value={password}
                setValue={setPassword}
              />
              <InputWithLabel
                type='password'
                identifier='conf-password'
                label="Confirm password"
                required={false}
                error={passwordConfErr}
                value={passwordConf}
                setValue={setPasswordConf}
              />
              <div className="text-sm">
                <LinkBold label="You already have account?" location="/login" />
              </div>
              {formErr && <div className="bg-bluish-red bg-opacity-10 text-red-500 text-sm p-2 rounded-sm border border-red-600 hover:border-red-500">{formErr}</div>}
              <div>
                <PrimaryBtn label="Register" action={handleSubmit} />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
