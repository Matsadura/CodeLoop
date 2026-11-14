/**
 * Renders different output messages based on code execution state
 * @param {Object} props - Component props
 * @param {'fail' | 'pass' | 'error' | null} props.codeState - Current state of code execution
 * @param {string} props.output - Text to display
 * @returns {React.ReactElement} Output message with appropriate styling
 */
export default function CodeOutput({ codeState, output }) {
	const styles = {
		fail: 'bg-red-500 text-bluish-red border-red-500 p-4',
		pass: 'bg-green-500 text-green-500 border-green-500 p-2',
	};
	const style = styles[codeState] || 'bg-blue-500 text-blue-500 border-blue-500 p-2';
	return <div className={`${style} bg-opacity-10 border border-opacity-50 text-sm font-mono overflow-auto`}>
		<pre className='whitespace-pre-wrap break-words max-w-full'>
			{output ?? ''}
		</pre>
	</div>
}
