import { useEffect, useState } from 'react';
import { RiFullscreenFill } from 'react-icons/ri';
import { FaCode } from 'react-icons/fa6';
import { BsCardText } from 'react-icons/bs';
import { RiFullscreenExitLine } from 'react-icons/ri';
import { GrCloudUpload } from 'react-icons/gr';
import { GrTest } from 'react-icons/gr';
import { TestsDragger } from './TestsDragger';
import { request } from '../tools/requestModule';
import { useParams } from 'react-router-dom';
import { TbRotateClockwise } from "react-icons/tb";
import { IoHomeOutline } from "react-icons/io5";

/**
 * Renders a full-width coding space with expandable task and code panels
 * This components is what will be randered in wide screens
 * @param {Object} props
 * @param {React.ReactNode} props.codeEditor - Monaco editor component
 * @param {React.ReactNode} props.taskView - Task markdown viewer component
 * @returns {React.ReactElement} Desktop split view component
 */
function CodingSpaceWide({ codeEditor, taskView, submitAction, snippet }) {
	const [expandTaskContainer, setExpandTaskContainer] = useState(false);
	const [expandCodeContainer, setExpandCodeContainer] = useState(false);
	const [showSubmitPanding, setSubmitPanding] = useState(false);
	const [showTests, setShowTests] = useState(false);
	const [taskStatus, setTaskStatus] = useState(null);

	const { taskId } = useParams();

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

	useEffect(() => getLastSubmission(), [showTests]);

	// To show the code status
	function getLastSubmission() {
		const request_header = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};
		request(`/tasks/${taskId}/submissions`, request_header).then((res) => {
			if (res.data.length === 0)
				console.log('empty tests');
			else {
				res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				console.log(res.data[0]);
				setTaskStatus(res.data[0].status)
			}
		});
	}

	function SubmitCode() {
		if (showSubmitPanding)
			return;
		const request_header = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				code: snippet,
				language: "python"
			})
		};
		setSubmitPanding(true);
		request(`/tasks/${taskId}/submit`, request_header).then((res) => {
			setSubmitPanding(false);
			setShowTests(true);
		}).catch((error) => {
			console.error("Submission error:", error);
			setSubmitPanding(false);
		});;
	}

	return <div className="p-4 bg-violet-600 h-screen relative">
		<TestsDragger open={showTests} setOpen={setShowTests} />

		<div className="grid grid-cols-12 rounded-md border-2 border-gray-300 border-opacity-30 overflow-hidden h-full">
			<div className='bg-violet-500 border-b border-gray-300 border-opacity-70 col-span-12 h-12 flex w-full px-4 justify-between'>
				<div className='flex items-center'>
					<button className="text-lg text-crimson-100 hover:text-crimson-200  flex items-center gap-1" onClick={toggleTask}>{expandTaskContainer ? <RiFullscreenExitLine /> : <RiFullscreenFill />} Task</button>
				</div>
				<div className='flex items-center gap-3'>
					<a className="text-sm border hover:border-transparent border-crimson-200  rounded-lg text-crimson-200 flex items-center gap-1 px-2 py-1" href='/tasks'><IoHomeOutline />Home</a>
					<button className="text-sm border hover:border-transparent border-crimson-200  rounded-lg text-crimson-200 flex items-center gap-1 px-2 py-1" onClick={() => setShowTests(!showTests)}><GrTest />Output & Tests</button>
					<button className={`text-sm text-gray-50 flex rounded-lg ${showSubmitPanding && 'cursor-not-allowed'} items-center gap-1 bg-crimson-100 hover:bg-crimson-200 px-2 py-1`} onClick={SubmitCode}>
						{showSubmitPanding ? <TbRotateClockwise className='animate-spin' /> : <GrCloudUpload />}  Submit
					</button>
					<span className={`text-sm text-gray-400 flex rounded-lg items-center gap-1 px-2 py-1`}>
						{taskStatus ?
							<span>Last submission status: <span className=''>{taskStatus}</span></span>
							: 'Sumbit your first submittion...'}

					</span>


				</div>
				<div className='flex items-center'>
					<button className="text-lg text-crimson-100 hover:text-crimson-200 flex items-center gap-1" onClick={toggleCode}>{expandCodeContainer ? <RiFullscreenExitLine /> : <RiFullscreenFill />} Editor</button>
				</div>
			</div>
			{/* buttons */}
			<div className={`${expandTaskContainer ? 'col-span-12' : 'col-span-5'} ${expandCodeContainer ? 'hidden' : null} col-span-12 h-full min-h-screen pb-24 overflow-auto`}>
				{taskView}
			</div>
			<div className={`py-2 bg-violet-500 ${expandTaskContainer ? 'hidden' : null} ${expandCodeContainer ? 'col-span-12' : 'col-span-7'} ${expandCodeContainer ? null : 'border-l'} border-l-white h-screen border-t-transparent`}>
				{codeEditor}
			</div>
		</div>
	</div>
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
		<div className="grid grid-cols-12 rounded-md border-2 border-gray-300 border-opacity-30 h-full mb-16">
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
export default function ResponsiveCodeWithTask({ codeEditor, taskView, submitAction, snippet }) {
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
		<CodingSpaceMobile codeEditor={codeEditor} taskView={taskView} submitAction={submitAction} snippet={snippet} />
		: <CodingSpaceWide codeEditor={codeEditor} taskView={taskView} submitAction={submitAction} snippet={snippet} />;
}
