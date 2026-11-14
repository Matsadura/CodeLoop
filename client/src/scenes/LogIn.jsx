import InputWithLabel from '../components/InputWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import FormMessage from '../components/FormMessage';
import { requestJson } from '../tools/requestModule';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCode } from 'react-icons/fa6';
import { useContext, useEffect, useState } from 'react';
import { DataContext } from '../components/dataContext';

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErr, setformErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, login, authError } = useContext(DataContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';
  const notice = location.state?.notice;

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  async function handleSubmit(e) {
    e.preventDefault();
    setformErr(null);
    if (!email.trim() || !password) {
      setformErr('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    const res = await requestJson('/login', 'POST', { email: email.trim(), password });
    if (res.ok && res.data.token) {
      const userRes = await login(res.data.token);
      if (!userRes.ok) setformErr(userRes.data.error);
    } else {
      setformErr(res.data.error);
    }
    setSubmitting(false);
  }

  return (
    <div className='flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='mx-auto h-12 w-auto'>
          <FaCode className='mx-auto h-12 w-auto text-crimson-200' aria-hidden='true' />
        </div>
        <h1 className='mt-6 text-center text-4xl font-bold tracking-tight text-white'>Log in!</h1>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-violet-300 py-8 px-4 ring-1 ring-crimson-400 rounded-lg sm:px-10'>
          <form className='space-y-6' onSubmit={handleSubmit} noValidate>
            <FormMessage success={notice} />
            {!formErr && authError ? <FormMessage error={authError} /> : null}
            <InputWithLabel
              label='Email address'
              type='email'
              identifier='email'
              autoComplete='email'
              required
              value={email}
              setValue={setEmail}
            />
            <InputWithLabel
              label='Password'
              type='password'
              identifier='password'
              autoComplete='current-password'
              required
              value={password}
              setValue={setPassword}
            />
            <FormMessage error={formErr} />
            <div>
              <PrimaryBtn label={submitting ? 'Logging in...' : 'Log in'} disabled={submitting} />
            </div>
          </form>
          <div className='flex justify-center items-center gap-2 mt-6'>
            <span className='text-center text-sm text-gray-200'>Not a member?</span>
            <button type='button' className='font-semibold pt-1 text-crimson-100 hover:text-crimson-200 focus:ring-blue-100 focus:ring-1' onClick={() => navigate('/register')}>Create account</button>
          </div>
        </div>
      </div>
    </div>
  )
}
