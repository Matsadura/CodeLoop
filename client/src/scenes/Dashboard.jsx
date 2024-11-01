import { useEffect, useState } from 'react';
import { request } from '../tools/requestModule';
import { useNavigate } from 'react-router-dom';
import { DataContext } from "../components/Context";
import { useContext } from "react";


function CatgalogProgress({ catalogTitle, data }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, [])

	const formatPercentage = (value) => Math.round(value);
	const correctPercentage = formatPercentage(data['correct_%']);


	return data.count_submissions > 0 ? (
		<div className="w-full max-w-3xl border border-crimson-200 bg-violet-400/50 rounded-lg shadow-lg overflow-hidden mb-8">
			<div className="p-6">
				<h2 className="text-2xl font-bold text-gray-50 mb-4 pb-4 border-b border-b-crimson-200/50">{catalogTitle}</h2>
				<div className="flex flex-col md:flex-row gap-6">
					<div className="flex-1 flex items-center justify-center">
						<div className="relative w-48 h-48">
							<svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
								<circle
									className="text-violet-100"
									strokeWidth="6"
									stroke="currentColor"
									fill="transparent"
									r="45"
									cx="50"
									cy="50"
								/>
								{mounted && (
									<circle
										className="text-crimson-100"
										strokeWidth="6"
										strokeDasharray={2 * Math.PI * 45}
										strokeDashoffset={2 * Math.PI * 45 * (1 - correctPercentage / 100)}
										strokeLinecap="round"
										stroke="currentColor"
										fill="transparent"
										r="45"
										cx="50"
										cy="50"
									/>
								)}
							</svg>
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="text-center">
									<span className="text-4xl font-bold text-gray-800 dark:text-white">{correctPercentage}%</span>
									<p className="text-sm text-gray-600 dark:text-gray-400">Correct</p>
								</div>
							</div>
						</div>
					</div>
					<div className="flex-1 grid grid-cols-2 gap-4">
						{Object.entries(data).map(([key, value]) => {
							if (key !== 'correct_%') {
								return (
									<div key={key} className="flex flex-col">
										<span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
											{key.replace('_', ' ').replace('%', '')}
										</span>
										<span className="text-2xl font-bold text-gray-800 dark:text-white">
											{key.includes('%') ? `${formatPercentage(value)}%` : value}
										</span>
									</div>
								)
							}
						})}
					</div>
				</div>
			</div>
		</div>) : null
}

function Stats() {
	const [stats, setStats] = useState({});

	useEffect(() => {
		const getStats = () => {
			const request_header = {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			};
			request(`/users/statistics/categories`, request_header).then((res) => {
				console.log(res.data);
				setStats(res.data);
			}).catch(err => console.error("Error fetching stats:", err));
		};
		getStats();
	}, []);

	return (
		<div className='px-8 mb-24'>
			{Object.entries(stats).map(([catalogTitle, data]) => (
				<CatgalogProgress key={catalogTitle} catalogTitle={catalogTitle} data={data} />
			))}
		</div>
	);
}


export default function Dashboard({ setNav }) {
	useEffect(() => {
		setNav();
	}, [])


	return <div>
		<UserCreatedTasks />
		<h1 className='text-gray-50 text-4xl font-bold mb-6 ml-8 mt-12'>Your Progress!</h1>
		<Stats />

	</div>
}

function UserCreatedTasks() {
	const [tasks, setTasks] = useState([]);
	const navigate = useNavigate();
	const { user } = useContext(DataContext);

	useEffect(() => {

		getAllTasks();
	}, []);

	function getAllTasks() {
		const request_header = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};
		request(`/tasks`, request_header).then((res) => {
			setTasks(res.data.filter(t => t.user_id === user.id));
		});
	}

	return tasks.length ? <div className="px-4 sm:px-6 lg:px-8">
		<div className='grid grid-cols-2'>
			<div className="mt-8 flex flex-col">
				<h1 className='text-gray-50 text-4xl font-bold mb-6 mt-2'>Your Creations!</h1>
				<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
						<div className="overflow-hidden ring-2 ring-white ring-opacity-5 border border-crimson-200 md:rounded-lg">
							<table className="min-w-full divide-y divide-crimson-200">
								<thead className="bg-violet-500 select-none">
									<tr>
										<th scope="col" className="py-3.5 max-w-52 pl-4 pr-3 text-left text-sm font-semibold text-crimson-200 sm:pl-6">
											Title
										</th>
										<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-crimson-200">
											#
										</th>
									</tr>
								</thead>
								<tbody className="bg-violet-400">
									{tasks.map((task, taskIdx) => (
										<tr key={task.id} className={taskIdx % 2 === 0 ? undefined : 'bg-violet-300'}>
											<td className="md:max-w-80 text-nowrap md:text-wrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
												<button
													className='truncate max-w-[400px] text-white hover:text-crimson-200 cursor-pointer text-start'
													// href={`/tasks/${task.id}`}
													onClick={() => navigate(`/tasks/${task.id}`)}
												>
													{task.title}
												</button>
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
												<button
													className='text-white hover:text-crimson-200 cursor-pointer'
													// href={`/tasks/${task.id}`}
													onClick={() => navigate(`/task/${task.id}/update`)}
												>
													update
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div> : null
}
