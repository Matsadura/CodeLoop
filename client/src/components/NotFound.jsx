import { useEffect } from 'react';

export default function NotFound({ setNav }) {
  useEffect(() => setNav, []);

  return <div className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">

    <div className="text-center">
      <p className="text-base font-semibold text-crimson-200">404</p>
      <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-gray-50 sm:text-7xl">
        Page not found
      </h1>
      <p className="mt-6 text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
        There is nothing here!
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <a
          href="/"
          className="flex items-center rounded border border-transparent bg-crimson-200 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-crimson-100 hover:border-crimson-200 focus:outline-none focus:ring-blue-100 focus:ring-1"
        >
          Go back home
        </a>
      </div>
    </div>
  </div>
}
