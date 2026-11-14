import { useEffect, useState } from 'react';
import { RiFullscreenFill } from 'react-icons/ri';
import { FaCode } from 'react-icons/fa6';
import { BsCardText } from 'react-icons/bs';
import { RiFullscreenExitLine } from 'react-icons/ri';
import { GrCloudUpload } from 'react-icons/gr';
import { GrTest } from 'react-icons/gr';
import { TestsDragger } from './TestsDragger';
import { Link } from 'react-router-dom';
import { TbRotateClockwise } from 'react-icons/tb';
import { IoHomeOutline } from 'react-icons/io5';

const STATUS_STYLES = {
	correct: 'text-green-400',
	incorrect: 'text-red-400',
	pending: 'text-blue-300',
	error: 'text-yellow-300',
};

/** Last submission status (and any submit error) */
function SubmissionStatus({ latest, submitError }) {
	return <span className='text-sm text-gray-400 flex flex-col px-2 py-1' role='status' aria-live='polite'>
		{latest ?
			<span>Last submission: <span className={STATUS_STYLES[latest.status] || ''}>{latest.status}</span></span>
			: 'Submit your first solution...'}
		{submitError ? <span className='text-yellow-300 text-xs'>{submitError}</span> : null}
	</span>
}

function SubmitButton({ onSubmit, submitting, className = '' }) {
	return <button type='button' disabled={submitting} aria-busy={submitting ? 'true' : undefined}
		className={`text-sm text-gray-50 flex rounded-lg items-center justify-center gap-1 bg-crimson-100 hover:bg-crimson-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
		onClick={onSubmit}>
		{submitting ? <TbRotateClockwise className='animate-spin' aria-hidden='true' /> : <GrCloudUpload aria-hidden='true' />}
		{submitting ? 'Running...' : 'Submit'}
	</button>
}

/**
 * Renders a full-width coding space with expandable task and code panels
 * This components is what will be randered in wide screens
 */
function CodingSpaceWide({ codeEditor, taskView, onSubmit, submitting, submitError, latest, showTests, setShowTests, resultsKey }) {
	const [expandTaskContainer, setExpandTaskContainer] = useState(false);
	const [expandCodeContainer, setExpandCodeContainer] = useState(false);

	function toggleTask() {
		setExpandCodeContainer(false);
		setExpandTaskContainer(!expandTaskContainer);
	}

	function toggleCode() {
		setExpandTaskContainer(false);
		setExpandCodeContainer(!expandCodeContainer);
	}

	return <div className='p-4 bg-violet-600 h-screen relative'>
		<TestsDragger open={showTests} setOpen={setShowTests} latest={latest} refreshKey={resultsKey} />

		<div className='grid grid-cols-12 rounded-md border-2 border-gray-300 border-opacity-30 overflow-hidden h-full'>
			<div className='bg-violet-500 border-b border-gray-300 border-opacity-70 col-span-12 min-h-12 flex w-full px-4 justify-between'>
				<div className='flex items-center'>
					<button type='button' className='text-lg text-crimson-100 hover:text-crimson-200  flex items-center gap-1' onClick={toggleTask}>{expandTaskContainer ? <RiFullscreenExitLine aria-hidden='true' /> : <RiFullscreenFill aria-hidden='true' />} Task</button>
				</div>
				<div className='flex items-center gap-3'>
					<Link className='text-sm border hover:border-transparent border-crimson-200  rounded-lg text-crimson-200 flex items-center gap-1 px-2 py-1' to='/tasks'><IoHomeOutline aria-hidden='true' />Home</Link>
					<button type='button' className='text-sm border hover:border-transparent border-crimson-200  rounded-lg text-crimson-200 flex items-center gap-1 px-2 py-1' onClick={() => setShowTests(!showTests)}><GrTest aria-hidden='true' />Output & Tests</button>
					<SubmitButton onSubmit={onSubmit} submitting={submitting} />
					<SubmissionStatus latest={latest} submitError={submitError} />
				</div>
				<div className='flex items-center'>
					<button type='button' className='text-lg text-crimson-100 hover:text-crimson-200 flex items-center gap-1' onClick={toggleCode}>{expandCodeContainer ? <RiFullscreenExitLine aria-hidden='true' /> : <RiFullscreenFill aria-hidden='true' />} Editor</button>
				</div>
			</div>
			<div className={`${expandTaskContainer ? 'col-span-12' : 'col-span-5'} ${expandCodeContainer ? 'hidden' : ''} h-full min-h-screen pb-24 overflow-auto`}>
				{taskView}
			</div>
			<div className={`py-2 bg-violet-500 ${expandTaskContainer ? 'hidden' : ''} ${expandCodeContainer ? 'col-span-12' : 'col-span-7 border-l'} border-l-white h-screen border-t-transparent`}>
				{codeEditor}
			</div>
		</div>
	</div>
}

/**
 * Renders a mobile-friendly view with toggleable task and code panels
 * This components is what will be randered in mobile screens
 */
function CodingSpaceMobile({ codeEditor, taskView, onSubmit, submitting, submitError, latest, showTests, setShowTests, resultsKey }) {
	const [showCode, setShowCode] = useState(false);

	const tabClass = (active) => `flex items-center justify-center gap-1 ${active ? 'bg-violet-400' : ''}`;

	return <div className='bg-violet-600 h-screen relative'>
		<TestsDragger open={showTests} setOpen={setShowTests} latest={latest} refreshKey={resultsKey} />
		<div className='flex items-center justify-between gap-2 bg-violet-500 px-2 py-2 border-b border-gray-300 border-opacity-40'>
			<Link className='text-sm text-crimson-200 flex items-center gap-1' to='/tasks'><IoHomeOutline aria-hidden='true' />Home</Link>
			<SubmissionStatus latest={latest} submitError={submitError} />
		</div>
		<div className='fixed z-50 bottom-0 right-0 h-12 bg-violet-500 border-t text-crimson-200 text-sm w-screen grid grid-cols-4 divide-x-2'>
			<button type='button' className={tabClass(!showCode)} onClick={() => setShowCode(false)} aria-pressed={!showCode}><BsCardText aria-hidden='true' />Task</button>
			<button type='button' className={tabClass(showCode)} onClick={() => setShowCode(true)} aria-pressed={showCode}><FaCode aria-hidden='true' />Code</button>
			<button type='button' className={tabClass(false)} onClick={() => setShowTests(true)}><GrTest aria-hidden='true' />Tests</button>
			<SubmitButton onSubmit={onSubmit} submitting={submitting} className='rounded-none' />
		</div>
		<div className='grid grid-cols-12 rounded-md border-2 border-gray-300 border-opacity-30 h-full pb-24'>
			<div className={`${showCode ? 'hidden' : 'col-span-12'} h-full overflow-auto`}>
				{taskView}
			</div>
			<div className={`${showCode ? 'col-span-12' : 'hidden'} h-full border-t-white`}>
				{codeEditor}
			</div>
		</div>
	</div>
}

/**
 * A responsive wrapper that switches between mobile and desktop layouts
 */
export default function ResponsiveCodeWithTask(props) {
	const [width, setWidth] = useState(window.innerWidth);

	useEffect(() => {
		function handleWindowSizeChange() {
			setWidth(window.innerWidth);
		}
		window.addEventListener('resize', handleWindowSizeChange);
		return () => {
			window.removeEventListener('resize', handleWindowSizeChange);
		}
	}, []);

	return width <= 768 ? <CodingSpaceMobile {...props} /> : <CodingSpaceWide {...props} />;
}
