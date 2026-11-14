import { Disclosure } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { DataContext } from './dataContext';

const linkClass = 'block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white';

export default function UserAvatarMobile({ userNavigation }) {
  const { user, logout } = useContext(DataContext);

  if (!user) {
    return <div className='border-t border-gray-700 pt-4 pb-3 space-y-1 px-2'>
      <Disclosure.Button as={Link} to='/login' className={linkClass}>Log in</Disclosure.Button>
      <Disclosure.Button as={Link} to='/register' className={linkClass}>Register</Disclosure.Button>
    </div>;
  }

  return <div className='border-t border-gray-700 pt-4 pb-3'>
    <div className='px-5'>
      <div className='text-base font-medium text-white'>{user.first_name} {user.last_name}</div>
      <div className='text-sm font-medium text-gray-400'>{user.email}</div>
    </div>
    <div className='mt-3 space-y-1 px-2'>
      {userNavigation.map((item) => (
        <Disclosure.Button key={item.name} as={Link} to={item.href} className={linkClass}>
          {item.name}
        </Disclosure.Button>
      ))}
      <Disclosure.Button as='button' type='button' onClick={logout} className={`${linkClass} w-full text-left`}>
        Log Out
      </Disclosure.Button>
    </div>
  </div>
}
