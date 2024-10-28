import { useNavigate } from 'react-router-dom';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function NavigationWideScreen({ navigation }) {
  const navigate = useNavigate();


  return <div className="hidden md:block">
    <div className="ml-10 flex items-baseline space-x-4">
      {navigation.map((item) => (
        <button
          key={item.name}
          // href={item.href}
          onClick={() => navigate(item.href)}
          className={classNames(
            item.current
              ? 'bg-crimson-100 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
            'px-3 py-2 rounded-md text-sm font-medium'
          )}
          aria-current={item.current ? 'page' : undefined}
        >
          {item.name}
        </button>
      ))}
    </div>
  </div>
}
