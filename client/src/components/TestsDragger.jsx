import TestCase from './TestCase';
import { FaTerminal } from 'react-icons/fa6';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GrTest } from 'react-icons/gr';
import CodeOutput from './CodeOutput';
import { FaFrog } from 'react-icons/fa6';

/**
 * Component for rendering a draggable panel with execution logs and test cases
 *
 * @param {boolean} props.open - Indicates if the panel is open.
 * @param {function} props.setOpen - Function to set the open state.
 * @returns {JSX.Element} The draggable panel component with execution logs and test cases.
 */
export function TestsDragger({ open, setOpen }) {
	return <Dragger
		open={open}
		setOpen={setOpen}
		title={
			<div className='flex items-center gap-4'>
				<FaFrog className='text-3xl' />
				Execution Logs
			</div>
		}
	>
		<h4 className='text-base font-semibold leading-6 text-gray-50 mb-6 flex items-center gap-2'><FaTerminal />Execution Logs</h4>
		<CodeOutput codeState={'fail'} />
		<h4 className='text-base font-semibold leading-6 text-gray-50 mb-6 flex items-center gap-2'><GrTest />Test cases your code will need to pass</h4>
		<TestCase />
	</Dragger>
}


/**
 * Component for rendering a draggable user's panel contains code output
 *
 * @param {boolean} props.open - Indicates if the panel is open
 * @param {function} props.setOpen - Function to set the open state
 * @returns {JSX.Element} The draggable output panel component
 */
export function RunDragger({ open, setOpen }) {
	return <Dragger
		open={open}
		setOpen={setOpen}
		title={
			<div className='flex items-center gap-4'>
				<FaTerminal className='text-3xl' />
				Output
			</div>
		}
	>
		<CodeOutput codeState={'fail'} />
	</Dragger>
}


/**
 * Dragger component that renders a draggable dialog.
 *
 * @param {boolean} props.open - Indicates if the dialog is open.
 * @param {function} props.setOpen - Function to set the open state of the dialog.
 * @param {string} [props.title] - The title of the dialog.
 * @param {React.ReactNode} props.children - The content to be displayed inside the dialog.
 * @returns {JSX.Element} The rendered Dragger component.
 */
export default function Dragger({ open, setOpen, title, children }) {
	return (
		<Dialog open={open} onClose={setOpen} className="relative z-10 text-sm">
			<DialogBackdrop
				transition
				className="fixed inset-0 bg-violet-300 bg-opacity-75 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
			/>

			<div className="fixed inset-0 overflow-hidden">
				<div className="absolute inset-0 overflow-hidden">
					<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
						<DialogPanel
							transition
							className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
						>
							<TransitionChild>
								<div className="absolute left-0 top-0 -ml-8 flex pr-2 pt-4 duration-500 ease-in-out data-[closed]:opacity-0 sm:-ml-10 sm:pr-4">
									<button
										type="button"
										onClick={() => setOpen(false)}
										className="relative rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
									>
										<span className="absolute -inset-2.5" />
										<span className="sr-only">Close panel</span>
										<XMarkIcon aria-hidden="true" className="h-6 w-6 text-crimson-200" />
									</button>
								</div>
							</TransitionChild>
							<div className="flex h-full flex-col overflow-y-scroll bg-violet-500 py-6 shadow-xl">
								<div className="px-4 sm:px-6 border-b border-b-crimson-200 pb-6">
									<DialogTitle className="text-xl font-semibold leading-6 text-crimson-200 flex gap-4 items-center">{title || 'Dragger'}</DialogTitle>
								</div>
								<div className="relative mt-6 flex-1 px-4 sm:px-6">
									{children}
								</div>
							</div>
						</DialogPanel>
					</div>
				</div>
			</div>
		</Dialog>
	)
}
