/**
 * InputWithLabel - A reusable form input component with an associated label
 *
 * @param {Object} props
 * @param {string} props.label - The text to display as the input label
 * @param {string} props.type - The input type (e.g., "text", "email", "password")
 * @param {string} props.identifier - Unique identifier for the input (used for id, name, and autoComplete)
 * @param {boolean} [props.required] - Whether the input is required
 * @param {string} [props.value] - Input content state
 * @param {function} [props.setValue] - Function to set input content state
 *
 * @returns {JSX.Element} A labeled input field with consistent styling
 */
export default function TextEreaWithLabel({ label, type, identefier, required, error, value, setValue }) {
	return <div>
		<label htmlFor={identefier} className="block text-sm font-medium text-white">
			{label}
		</label>
		<div className="mt-3">
			<textarea
				id={identefier}
				name={identefier}
				type={type}
				autoComplete={identefier}
				required={required}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className="block w-full font-mono appearance-none bg-violet-400 rounded-md border border-crimson-300 hover:border-crimson-100 px-3 py-2 shadow-sm text-white focus:border-crimson-200 focus:outline-none focus:ring-blue-300 sm:text-sm"
			/>
		</div>
		{error ? <div className="text-bluish-red gap-1 mt-2 font-light flex flex-start items-center">
			<MdErrorOutline className="text-lg" />
			<span className="text-sm grow-0">{error}</span>
		</div> : null}
	</div>
}
