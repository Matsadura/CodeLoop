import { useEffect, useState } from 'react';
import { RiFullscreenFill } from 'react-icons/ri';
import { FaCode } from 'react-icons/fa6';
import { BsCardText } from 'react-icons/bs';
import { RiFullscreenExitLine } from 'react-icons/ri';

/**
 * Renders a full-width coding space with expandable task and code panels
 * This components is what will be randered in wide screens
 * @param {Object} props
 * @param {React.ReactNode} props.codeEditor - Monaco editor component
 * @param {React.ReactNode} props.taskView - Task markdown viewer component
 * @returns {React.ReactElement} Desktop split view component
 */
function CodingSpaceWide({ codeEditor, taskView }) {
	const [expandTaskContainer, setExpandTaskContainer] = useState(false);
	const [expandCodeContainer, setExpandCodeContainer] = useState(false);

	function toggleTask() {
		if (expandTaskContainer) {
			setExpandCodeContainer(false);
			setExpandTaskContainer(false);
		} else {
			setExpandCodeContainer(false);
			setExpandTaskContainer(true);
		}
	}

	function toggleCode() {
		if (expandCodeContainer) {
			setExpandCodeContainer(false);
			setExpandTaskContainer(false);
		} else {
			setExpandCodeContainer(true);
			setExpandTaskContainer(false);
		}
	}

	return <div className="p-4 bg-violet-600 h-screen relative">
		<div className="grid grid-cols-12 rounded-md border-2 border-gray-300 border-opacity-30 overflow-hidden h-full">
			<div className={`${expandTaskContainer ? 'col-span-12' : 'col-span-5'} ${expandCodeContainer ? 'hidden' : null} col-span-12 h-full overflow-auto relative`}>
				<div className="h-0 z-50 sticky top-4 right-0 flex justify-end pr-4">
					<button className="text-xl text-crimson-200" onClick={toggleTask}>{expandTaskContainer ? <RiFullscreenExitLine /> : <RiFullscreenFill />}</button>
				</div>
				{taskView}
			</div>
			<div className={`${expandTaskContainer ? 'hidden' : null} ${expandCodeContainer ? 'col-span-12' : 'col-span-7'} border-l border-l-white h-screen border-t-transparent relative`}>
				<div className="h-0 sticky z-50 top-4 right-0 flex justify-end pr-4">
					<button className="text-xl z-50 text-crimson-200" onClick={toggleCode}>{expandCodeContainer ? <RiFullscreenExitLine /> : <RiFullscreenFill />}</button>
				</div>
				{codeEditor}
			</div>
		</div>
	</div >
}

/**
 * Renders a mobile-friendly view with toggleable task and code panels
 * This components is what will be randered in mobile screens
 * @param {Object} props
 * @param {React.ReactNode} props.codeEditor - Monaco editor component
 * @param {React.ReactNode} props.taskView - Task markdown viewer component
 * @returns {React.ReactElement} Mobile view component
 */
function CodingSpaceMobile({ codeEditor, taskView }) {
	const [taskMobile, setTaskMobile] = useState(true);
	const [codeMobile, setCodeMobile] = useState(false);

	function showCodeMobile() {
		setTaskMobile(false);
		setCodeMobile(true);
	}

	function showTaskMobile() {
		setTaskMobile(true);
		setCodeMobile(false);
	}

	return <div className="bg-violet-600 h-screen relative">
		<div className="fixed z-50 bottom-0 right-0 h-10 bg-violet-500 border-t text-crimson-200 text-xl w-screen md:hidden grid grid-cols-2 divide-x-2">
			<button className="grid-cols-1 flex items-center justify-center" onClick={showCodeMobile}><FaCode /></button>
			<button className="grid-cols-1 flex items-center justify-center" onClick={showTaskMobile}><BsCardText /></button>
		</div>
		<div className="grid grid-cols-12 rounded-md border-2 border-gray-300 border-opacity-30 h-full">
			<div className={`${taskMobile ? 'col-span-12' : 'hidden'}  col-span-12 h-full overflow-auto`}>
				{taskView}
			</div>
			<div className={`${codeMobile ? 'col-span-12' : 'hidden'} h-screen border-t-white`}>
				{codeEditor}
			</div>
		</div>
	</div >
}

/**
 * A responsive wrapper that switches between mobile and desktop layouts
 * @param {Object} props
 * @param {React.ReactNode} props.codeEditor - Monaco editor component
 * @param {React.ReactNode} props.taskView - Task markdown viewer component
 * @returns {React.ReactElement} Responsive component
 */
export default function ResponsiveCodeWithTask({ codeEditor, taskView }) {
	const [width, setWidth] = useState(window.innerWidth);

	function handleWindowSizeChange() {
		setWidth(window.innerWidth);
	}
	useEffect(() => {
		window.addEventListener('resize', handleWindowSizeChange);
		return () => {
			window.removeEventListener('resize', handleWindowSizeChange);
		}
	}, []);

	const isMobile = width <= 768;
	return isMobile ?
		<CodingSpaceMobile codeEditor={codeEditor} taskView={taskView} />
		: <CodingSpaceWide codeEditor={codeEditor} taskView={taskView} />;
}
