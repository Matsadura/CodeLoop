import { VscError } from "react-icons/vsc";
import { MdOutlineErrorOutline } from "react-icons/md";
import appFullScreen from '../staticFiles/entireFullScreen.png';
import executionLogsScreenShot from '../staticFiles/executionLogs.png';
import createTaskScreenShot from '../staticFiles/createTaskScreenShot.png';
import { BsMarkdown } from "react-icons/bs";
import { IoCreateOutline } from "react-icons/io5";
import { PiTestTubeLight } from "react-icons/pi";
import { FaRegCheckCircle } from "react-icons/fa";


const features = [
	{
		name: 'Create new task',
		description:
			'Includes a brief description to guide users on what they need to achieve',
		icon: IoCreateOutline,
	},
	{
		name: 'Make it using markdown',
		description:
			'Use the markdown  syntax to format your text and make it more readable',

		icon: BsMarkdown,
	},
	{
		name: 'Create inputs tests',
		description:
			'Specify the input parameters required for the task.',
		icon: PiTestTubeLight,
	},
	{
		name: 'Add expected outputs',
		description:
			'Define the expected outcomes for the given inputs.',
		icon: FaRegCheckCircle,
	},
]

function CreatingTaskFeature() {
	return (
		<div className="py-24 sm:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl lg:text-center">
					<h2 className="text-base/7 font-semibold text-crimson-200">Be the instructor</h2>
					<p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-50 sm:text-5xl lg:text-balance">
						Make your own tasks and let the community learn from you!
					</p>
					<p className="mt-6 text-lg/8 text-gray-400">
						Create your own coding tasks and share them with the community, enabling others to learn and grow through your unique challenges!
					</p>
				</div>
				<div className="mx-auto max-w-7xl px-8 mt-12 sm:px-6">
					<img
						className="relative rounded-lg shadow-lg border-2 border-crimson-200"
						// src="https://tailwindui.com/plus/img/component-images/dark-project-app-screenshot.png"
						src={createTaskScreenShot}
						alt="App screenshot"
					/>
				</div>
				<div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
					<dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
						{features.map((feature) => (
							<div key={feature.name} className="relative pl-16">
								<dt className="text-base/7 font-semibold text-gray-50">
									<div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-crimson-200">
										<feature.icon aria-hidden="true" className="h-6 w-6 text-white" />
									</div>
									{feature.name}
								</dt>
								<dd className="mt-2 text-base/7 text-gray-500 hover:text-gray-200">{feature.description}</dd>
							</div>
						))}
					</dl>
				</div>
			</div>
		</div>
	)
}

export default function Home() {
	return (
		<div className="bg-violet-500">
			<div className="relative overflow-hidden">
				<div className="relative pt-6 pb-16 sm:pb-24">
					<div className="mx-auto mt-16 max-w-7xl px-4 sm:mt-24 sm:px-6">
						<div className="text-center">
							<h1 className="text-4xl font-bold tracking-tight text-gray-100 sm:text-5xl md:text-6xl">
								<span className="block">Master the Art of Writing </span>
								<span className="block text-crimson-200">"Bugless" code!</span>
							</h1>
							<p className="mx-auto mt-3 max-w-md text-base text-gray-400 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
								An interactive application where coders create challenges, submit solutions, and grow together through shared learning and support.
							</p>
						</div>
					</div>
				</div>

				<div className="relative">
					<div className="absolute inset-0 flex flex-col" aria-hidden="true">
						<div className="flex-1" />
						<div className="w-full flex-1 bg-violet-200" />
					</div>
					<div className="mx-auto  max-w-7xl px-4 sm:px-6">
						<img
							className="relative rounded-lg shadow-lg border-2 border-crimson-200"
							// src="https://tailwindui.com/plus/img/component-images/dark-project-app-screenshot.png"
							src={appFullScreen}
							alt="App screenshot"
						/>
					</div>
				</div>
			</div>
			<div className="overflow-hidden bg-violet-200 py-24 sm:py-32">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
						<div className="lg:pr-8 lg:pt-4">
							<div className="lg:max-w-lg">
								<h2 className="text-base/7 font-semibold text-crimson-200">Test your code</h2>
								<p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-50 sm:text-5xl">
									Execution lab!
								</p>
								<p className="mt-6 text-lg/8 text-gray-300">
									We have a clever bug-catching frog  that checks your code, find errors and guidi you to write cleaner, bug-free solutions!
								</p>
								<dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-600 lg:max-w-none">
									<div className="relative pl-9 flex items-center gap-5">
										<dt className="inline font-semibold text-green-600 text-3xl">
											<FaRegCheckCircle />
										</dt>
										<dd className="inline text-green-600 hover:text-gray-50">Celebrates your success by showcasing passed tests, ensuring you stay motivated as you write cleaner, error-free code!</dd>
									</div>
									<div className="relative pl-9 flex items-center gap-5">
										<dt className="inline font-semibold text-red-600 text-3xl">
											<VscError />
										</dt>
										<dd className="inline  text-red-600 hover:text-gray-50">Highlights failed tests in your code, helping you identify errors and improve your coding skills!</dd>
									</div>
									<div className="relative pl-9 flex items-center gap-5">
										<dt className="inline font-semibold text-blue-300 text-3xl">
											<MdOutlineErrorOutline />
										</dt>
										<dd className="inline  text-blue-300 hover:text-gray-50">If your code fails, we provides all the standard error messages, helping you quickly identify and resolve issues in your code!</dd>
									</div>
								</dl>
							</div>
						</div>
						<img
							alt="Product screenshot"
							src={executionLogsScreenShot}
							width={2432}
							height={1442}
							className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-crimson-200 sm:w-[57rem] md:-ml-4 lg:-ml-0"
						/>
					</div>
				</div>
			</div>
			<CreatingTaskFeature />

		</div>
	)
}
