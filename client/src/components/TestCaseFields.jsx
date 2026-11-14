import { useState } from 'react';
import { IoMdCheckmark } from 'react-icons/io';
import { HiXMark } from 'react-icons/hi2';
import TextEreaWithLabel from './TextEreaWithLabel';

/**
 * Controlled editor for one test case of a task.
 *
 * @param {Object} props.test - `{ id, input, output }`
 * @param {number} props.index - Position (used for labels)
 * @param {function} props.onChange - Called with the updated test
 * @param {function} props.onRemove - Called when the user confirms removal
 * @param {boolean} [props.confirmRemove] - Ask for confirmation first
 */
export default function TestCaseFields({ test, index, onChange, onRemove, confirmRemove = false }) {
	const [sureToDelete, setSureToDelete] = useState(false);

	function remove() {
		setSureToDelete(false);
		onRemove(test);
	}

	return <fieldset className='border border-crimson-200 border-opacity-40 p-4 rounded-lg flex flex-col gap-4'>
		<legend className='text-crimson-200 underline text-lg px-1'>Test case {index + 1}</legend>
		<TextEreaWithLabel label='Input test' identifier={`test_input_${test.id}`} rows={2}
			value={test.input} setValue={(input) => onChange({ ...test, input })} />
		<TextEreaWithLabel label='Expected output' identifier={`test_output_${test.id}`} rows={2}
			value={test.output} setValue={(output) => onChange({ ...test, output })} />

		{sureToDelete ? <div>
			<span className='text-xl text-gray-300 mx-4'>Sure?</span>
			<button type='button' aria-label='Confirm removal' className='border border-green-600 text-green-600 text-lg p-1 rounded-full mr-2' onClick={remove}><IoMdCheckmark aria-hidden='true' /></button>
			<button type='button' aria-label='Cancel removal' className='border border-red-600 text-red-600 text-lg p-1 rounded-full ' onClick={() => setSureToDelete(false)}><HiXMark aria-hidden='true' /></button>
		</div> : <button type='button' className='border border-red-600 px-2 py-1 rounded-lg text-red-600 mt-5 self-start'
			onClick={() => (confirmRemove ? setSureToDelete(true) : remove())}>
			Remove
		</button>}
	</fieldset>
}
