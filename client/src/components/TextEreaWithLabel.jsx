import { MdErrorOutline } from 'react-icons/md';

/**
 * TextEreaWithLabel - A reusable labeled textarea
 *
 * @param {Object} props
 * @param {string} props.label - The text to display as the label
 * @param {string} props.identifier - Unique id (also used for name); `identefier` is accepted for backward compatibility
 * @param {boolean} [props.required] - Whether the field is required
 * @param {string} [props.error] - Error message shown under the field
 * @param {string} [props.value] - Content state
 * @param {function} [props.setValue] - Function to set content state
 *
 * @returns {JSX.Element} A labeled textarea with consistent styling
 */
export default function TextEreaWithLabel({ label, identifier, identefier, required, error, value, setValue, rows = 4 }) {
	const id = identifier || identefier;
	const errorId = `${id}-error`;
	return <div>
		<label htmlFor={id} className='block text-sm font-medium text-white'>
			{label}
		</label>
		<div className='mt-3'>
			<textarea
				id={id}
				name={id}
				rows={rows}
				required={required}
				value={value ?? ''}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? errorId : undefined}
				onChange={(e) => setValue(e.target.value)}
				className='block w-full font-mono appearance-none bg-violet-400 rounded-md border border-crimson-300 hover:border-crimson-100 px-3 py-2 shadow-sm text-white focus:border-crimson-200 focus:outline-none focus:ring-blue-300 sm:text-sm'
			/>
		</div>
		{error ? <div id={errorId} className='text-bluish-red gap-1 mt-2 font-light flex flex-start items-center'>
			<MdErrorOutline className='text-lg' aria-hidden='true' />
			<span className='text-sm grow-0'>{error}</span>
		</div> : null}
	</div>
}
