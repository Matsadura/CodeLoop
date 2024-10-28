import { Disclosure } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';

export default function UserAvatarMobile({ user, userNavigation }) {
  return <div className="border-t border-gray-700 pt-4 pb-3">
    <div className="flex items-center px-5">
      <div className="flex-shrink-0">
        {user.imageUrl ?
          <img className="h-10 w-10 rounded-full" src={user.imageUrl} alt="user image profile" />
          :
          <img className="h-10 w-10 rounded-full" src='https://i.pinimg.com/originals/ed/1b/58/ed1b58e5741ea17739e673a6d30182df.jpg' alt="user image profile" />
        }
      </div>
      <div className="ml-3">
        <div className="text-base font-medium text-white">{user.name}</div>
        <div className="text-sm font-medium text-gray-400">{user.email}</div>
      </div>
      <button
        type="button"
        className="ml-auto flex-shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
    <div className="mt-3 space-y-1 px-2">
      {userNavigation.map((item) => (
        <Disclosure.Button
          key={item.name}
          as="a"
          href={item.href}
          className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          {item.name}
        </Disclosure.Button>
      ))}
    </div>
  </div>
}
