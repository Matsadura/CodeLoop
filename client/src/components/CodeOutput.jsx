/**
 * Renders different output messages based on code execution state
 * @param {Object} props - Component props
 * @param {'fail' | 'success' | null} props.codeState - Current state of code execution
 * @returns {React.ReactElement} Output message with appropriate styling
 */
export default function CodeOutput({ codeState, output }) {
	if (codeState === 'fail') {
		return <div className='bg-red-500 bg-opacity-10 text-bluish-red border border-red-500 p-4 border-opacity-50 text-sm font-mono overflow-auto'>
			<pre className='whitespace-pre-line break-words max-w-full'>
				{output}
			</pre>
		</div >
	} else if (codeState === 'pass') {
		return <div className='bg-green-500 bg-opacity-10 text-green-500 border border-green-500 p-2 border-opacity-50 text-sm font-mono overflow-auto'>
			<pre className='whitespace-pre-line break-words max-w-full'>
				{output}
			</pre>
		</div>
	} else {
		return <div className='bg-blue-500 bg-opacity-10 text-blue-500 border border-blue-500 p-2 border-opacity-50 text-sm font-mono overflow-auto'>
			<div>
				Nothing to display yet
			</div>
			<div>
				Hit the submit button when you&apos;re ready!
			</div>
		</div>
	}
}
