/**
 * PrimaryBtnOutline - A reusable Primary outline btn
 * 
 * @param {Object} props
 * @param {string} props.label - The text to display as the button label
 * @param {function} props.action - The function to be called when button clicked
 *
 * @returns {JSX.Element} A labeled input field with consistent styling
 */
export default function PrimaryBtnOutline({ label, action }) {
    return <button
        type="submit"
        className="flex w-full justify-center rounded-md border-2 text-sm border-crimson-200 py-2 px-4 font-medium text-crimson-200 shadow-sm hover:border-transparent focus:outline-none focus:ring-blue-100 focus:ring-1"
        onClick={action}
    >
        {label}
    </button>
}
