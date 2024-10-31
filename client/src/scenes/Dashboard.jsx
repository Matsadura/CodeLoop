import { useEffect, useState } from 'react';
import { request } from '../tools/requestModule';
import { useNavigate } from 'react-router-dom';
import { DataContext } from "../components/Context";
import { useContext } from "react";

export default function Dashboard({ setNav }) {
	const [tasks, setTasks] = useState([]);
	const navigate = useNavigate();
	const { user } = useContext(DataContext);

	useEffect(() => {
		setNav()
		getAllTasks();
	}, []);

	function getAllTasks() {
		const request_header = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};
		request(`/tasks`, request_header).then((res) => {
			console.log(res.data)
			setTasks(res.data.filter(t => t.user_id === user.id));
		});
	}

	return <div className="px-4 sm:px-6 lg:px-8">
		<div className='grid grid-cols-2'>
			<div className="mt-8 flex flex-col">
				<h1 className='text-gray-50 text-4xl font-bold mb-6 mt-2'>Your Creations!</h1>
				<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
						<div className="overflow-hidden ring-2 ring-white ring-opacity-5 border-2 border-crimson-200 border-opacity-80 md:rounded-lg">
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
									{tasks.length ? tasks.map((task, taskIdx) => (
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
									)) : null}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
}
