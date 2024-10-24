/**
 * PrimaryBtn - A reusable Primary btn
 * 
 * @param {Object} props
 * @param {string} props.label - The text to display as the button label
 * @param {function} props.action - The function to be called when button clicked
 *
 * @returns {JSX.Element} A labeled input field with consistent styling
 */
export default function PrimaryBtn({label, action}) {
    return <button
    type="submit"
    className="flex w-full justify-center rounded-md border border-transparent bg-crimson-200 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-crimson-100 focus:outline-none focus:ring-blue-100 focus:ring-1"
    onClick={action}
    >
    {label}
    </button>
}