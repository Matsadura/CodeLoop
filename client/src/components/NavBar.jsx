/* This example requires Tailwind CSS v2.0+ */
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FaCode } from "react-icons/fa6";
import UserAvatarWideScreen from './UserAvatarWideScreen';
import UserAvatarMobile from './UserAvatarMobile';
import NavigationWideScreen from './NavigationWideScreen';
import NavigationMobile from './NavigationMobile';

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://i.pinimg.com/originals/ed/1b/58/ed1b58e5741ea17739e673a6d30182df.jpg',
}
const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Tasks', href: '/catalogs/1/tasks', current: false },
  { name: 'splitedUI', href: '/split', current: false },
  { name: 'Catalog', href: '/catalogs', current: false },
]
const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

export default function NavBar({ children, title }) {
  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-violet-500">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center">
                    <a className="flex-shrink-0" href="/">
                      <FaCode className='text-crimson-200 h-8 w-8 text-4xl' />
                    </a>
                    {/* big screen */}
                    <NavigationWideScreen navigation={navigation} />
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      <button
                        type="button"
                        className="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-crimson-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                      >
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </button>

                      {/* Profile dropdown */}
                      <UserAvatarWideScreen userNavigation={userNavigation} user={user} />
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <NavigationMobile navigation={navigation} />
                <UserAvatarMobile user={user} userNavigation={userNavigation} />
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <header className="bg-violet-400 shadow-sm">
          <div className="mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold leading-6 text-gray-100">{title}</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto p-4 max-w-7xl py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
