import { FaCode } from 'react-icons/fa6';
import InputWithLabel from '../components/InputWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import LinkBold from '../components/LinkBold';
import FormMessage from '../components/FormMessage';
import { useContext, useEffect, useState } from 'react';
import { requestJson } from '../tools/requestModule';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../components/dataContext';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [errors, setErrors] = useState({});
  const [formErr, setformErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(DataContext);

  // redirect when already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/profile', { replace: true });
  }, [isAuthenticated, navigate]);

  function validate() {
    const found = {};
    if (!fname.trim()) found.first_name = 'First name is required';
    if (!lname.trim()) found.last_name = 'Last name is required';
    if (!EMAIL_RE.test(email.trim())) found.email = 'Enter a valid email address';
    if (password.length < MIN_PASSWORD_LENGTH) found.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
    if (password !== passwordConf) found.passwordConf = 'The password confirmation does not match';
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setformErr(null);
    if (!validate()) return;
    setSubmitting(true);
    const res = await requestJson('/register', 'POST', {
      first_name: fname.trim(),
      last_name: lname.trim(),
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (res.status === 201) {
      navigate('/login', { state: { notice: 'Account created. You can log in now.' } });
    } else {
      if (res.data.field) setErrors({ [res.data.field]: res.data.error });
      setformErr(res.data.error);
    }
  }

  return (
    <div className='flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='mx-auto h-12 w-auto'>
          <FaCode className='mx-auto h-12 w-auto text-crimson-200' aria-hidden='true' />
        </div>
        <h1 className='mt-6 text-center text-4xl font-bold tracking-tight text-white'>Register to get started!</h1>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-violet-300 py-8 px-4 ring-1 ring-crimson-400 rounded-lg sm:px-10'>
          <form className='space-y-6' onSubmit={handleSubmit} noValidate>
            <div className='flex flex-col sm:flex-row gap-4'>
              <InputWithLabel identifier='first_name' label='First Name' autoComplete='given-name' required
                value={fname} setValue={setFname} error={errors.first_name} />
              <InputWithLabel identifier='last_name' label='Last Name' autoComplete='family-name' required
                value={lname} setValue={setLname} error={errors.last_name} />
            </div>
            <InputWithLabel type='email' identifier='email' label='Email address' autoComplete='email' required
              value={email} setValue={setEmail} error={errors.email} />
            <InputWithLabel type='password' identifier='password' label='Password' autoComplete='new-password' required
              minLength={MIN_PASSWORD_LENGTH} value={password} setValue={setPassword} error={errors.password} />
            <InputWithLabel type='password' identifier='conf-password' label='Confirm password' autoComplete='new-password' required
              value={passwordConf} setValue={setPasswordConf} error={errors.passwordConf} />
            <div className='text-sm'>
              <LinkBold label='You already have account?' location='/login' />
            </div>
            <FormMessage error={formErr} />
            <div>
              <PrimaryBtn label={submitting ? 'Creating account...' : 'Register'} disabled={submitting} />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
