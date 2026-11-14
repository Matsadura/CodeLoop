import { MdErrorOutline } from 'react-icons/md';

/**
 * InputWithLabel - A reusable form input component with an associated label
 *
 * @param {Object} props
 * @param {string} props.label - The text to display as the input label
 * @param {string} [props.type] - The input type (e.g., "text", "email", "password")
 * @param {string} props.identifier - Unique id (also used for name); `identefier` is accepted for backward compatibility
 * @param {string} [props.autoComplete] - Browser autocomplete hint
 * @param {boolean} [props.required] - Whether the input is required
 * @param {string} [props.error] - Error message shown under the input
 * @param {string} [props.value] - Input content state
 * @param {function} [props.setValue] - Function to set input content state
 *
 * @returns {JSX.Element} A labeled input field with consistent styling
 */
export default function InputWithLabel({ label, type = 'text', identifier, identefier, autoComplete, required, error, value, setValue, ...rest }) {
  const id = identifier || identefier;
  const errorId = `${id}-error`;
  return <div>
    <label htmlFor={id} className='block text-sm font-medium text-white'>
      {label}
    </label>
    <div className='mt-3'>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value ?? ''}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => setValue(e.target.value)}
        className='block w-full appearance-none bg-violet-400 rounded-md border border-crimson-300 hover:border-crimson-100 px-3 py-2 shadow-sm text-white focus:border-crimson-200 focus:outline-none focus:ring-blue-300 sm:text-sm'
        {...rest}
      />
    </div>
    {error ? <div id={errorId} className='text-bluish-red gap-1 mt-2 font-light flex flex-start items-center'>
      <MdErrorOutline className='text-lg' aria-hidden='true' />
      <span className='text-sm grow-0'>{error}</span>
    </div> : null}
  </div>
}
