/**
 * PrimaryBtn - A reusable Primary btn
 *
 * @param {Object} props
 * @param {string} props.label - The text to display as the button label
 * @param {function} props.action - The function to be called when button clicked
 * @param {string} [props.type] - Button type (defaults to "submit")
 * @param {boolean} [props.disabled] - Disable the button (e.g. while a request runs)
 *
 * @returns {JSX.Element} A styled button
 */
export default function PrimaryBtn({ label, action, type = 'submit', disabled = false }) {
    return <button
        type={type}
        disabled={disabled}
        aria-busy={disabled ? 'true' : undefined}
        className='flex w-full justify-center rounded-md border border-transparent bg-crimson-200 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-crimson-100 focus:outline-none focus:ring-blue-100 focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60'
        onClick={action}
    >
        {label}
    </button>
}
