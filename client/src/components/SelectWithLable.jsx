import { MdErrorOutline } from 'react-icons/md';

export default function SelectWithLabel({ children, label, identefier, required, error, value, setValue }) {
    return <div>
        <label htmlFor={identefier} className="block text-sm font-medium text-white">
            {label}
        </label>
        <div className="mt-3">
            <select
                id={identefier}
                name={identefier}
                required={required}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="block w-full appearance-none bg-violet-400 rounded-md border border-crimson-300 hover:border-crimson-100 px-3 py-2 shadow-sm text-white focus:border-crimson-200 focus:outline-none focus:ring-blue-300 sm:text-sm"
            >
                {children}
            </select>
        </div>
        {error ? <div className="text-bluish-red gap-1 mt-2 font-light flex flex-start items-center">
            <MdErrorOutline className="text-lg" />
            <span className="text-sm grow-0">{error}</span>
        </div> : null}
    </div>
}
