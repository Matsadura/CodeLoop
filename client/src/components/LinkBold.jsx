import { useNavigate } from 'react-router-dom';

/**
 * LinkBold - A reusable Link
 *
 * @param {Object} props
 * @param {string} props.label - The text to display as the link text
 * @param {string} props.location - The href of the link
 *
 * @returns {JSX.Element} A labeled bold link field with consistent styling
 */
export default function LinkBold({ label, location }) {
  const navigate = useNavigate();

  return <button type='button' onClick={() => navigate(location || '#')}
    className="font-medium text-crimson-200 hover:text-crimson-100 focus:outline-none focus:ring-blue-100 focus:ring-1">
    {label}
  </button>
}
