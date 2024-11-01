import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { request } from '../tools/requestModule';


export default function UserAvatarWideScreen({ userNavigation }) {
  const [picUrl, setPicUrl] = useState(null);

  function logout(e) {
    e.preventDefault();
    localStorage.removeItem('_token');
    window.location.replace(e.currentTarget.href);
  }

  useEffect(() => {
    const requestHeader = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    request("/users/profile", requestHeader).then((res) => {
      if (res.status === 200) {
        setPicUrl(res.data.profile_pic);
      } else initProfile();
    }).catch((e) => console.error("Error updating user profile:", e));
  }, []);

  function initProfile() {
    const requestHeader = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_pic: import.meta.env.VITE_DEFAULT_AVATAR, bio: 'Hello...' })
    };
    request("/users/profile", requestHeader).then((res) => {
      setPicUrl(res.data.profile_pic);
    }).catch((e) => console.error("Error Creating user profile:", e));
  }

  return <Menu as="div" className="relative ml-3">
    <div>
      <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
        <span className="sr-only">Open user menu</span>
        <img className="h-10 w-10 rounded-full" src={picUrl} alt="user image profile" />
      </Menu.Button>
    </div>
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded bg-violet-200 py-1 border border-gray-50 border-opacity-20 focus:outline-none">
        {userNavigation.map((item) => (
          <Menu.Item key={item.name}>
            {() => (
              <a
                href={item.href}
                className="block px-4 py-2 text-sm text-gray-50 hover:bg-violet-500"
              >
                {item.name}
              </a>
            )}
          </Menu.Item>
        ))}
        <Menu.Item>
          {() => (
            <a
              onClick={logout}
              href='/'
              className="block px-4 py-2 text-sm text-gray-50 hover:bg-violet-500"
            >
              Log Out
            </a>
          )}
        </Menu.Item>
      </Menu.Items>
    </Transition>
  </Menu>
}
