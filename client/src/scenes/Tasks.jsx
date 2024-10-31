import { request } from '../tools/requestModule';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

// const tasks = [
// 	{
// 		id: 1,
// 		title: 'Cpu is important',
// 		status: 'Error',
// 		difficulty: 'HARD'
// 	},
// 	{ id: 2, title: 'Werite your own shell', status: 'Done', difficulty: 'HARD' },
// 	{ id: 3, title: 'Lindsay Walton', status: 'Compile error', difficulty: 'HARD' },
// 	{ id: 4, title: 'Lindsay Walton', status: 'SegFault', difficulty: 'HARD' },
// 	{ id: 5, title: 'Lindsay Walton', status: 'Done', difficulty: 'HARD' },
// ]

function NoTasks() {
	return <tr className='bg-violet-300'>
		<td className='col-span-full text-center py-8' colSpan={2}>
			<span className='text-3xl  font-bold text-gray-50'>Empty buffer :(</span>
			<a href='/task/create' className='text-crimson-200 block mt-4'>Be the first creator</a>
		</td>
	</tr>
}

export default function Tasks({ setNav }) {
	const { id_catalog } = useParams();
	const [tasks, setTasks] = useState([]);
	const [catalogInfo, setCatalogInfo] = useState(null);
	const navigate = useNavigate();


	useEffect(() => setNav(), []);

	useEffect(() => {
		if (id_catalog) {
			let requestHeader = {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			};
			request("/categories", requestHeader)
				.then((res) => {
					if (res.status !== 201) {
						const FetchedCatalogInfo = res.data.find((c => c.id === id_catalog));
						setCatalogInfo(FetchedCatalogInfo);
					}
				}).catch((e) => console.error("Error getting catalog with id " + id_catalog, e));
			getCatalogTasks(id_catalog);
		} else {
			getAllTasks();
		}
	}, []);

	function getCatalogTasks(catalog_id) {
		const request_header = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};
		request(`/categories/${catalog_id}/tasks`, request_header).then((res) => {
			setTasks(res.data);
		});
	}

	function getAllTasks() {
		const request_header = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};
		request(`/tasks`, request_header).then((res) => {
			setTasks(res.data);
		});
	}

	return (
		<div className="px-4 sm:px-6 lg:px-8">
			<div className="mt-8 flex flex-col">
				{catalogInfo ? <div className='mb-8'>
					<div className='flex gap-12'>
						<img className='h-52 rounded-md border border-crimson-200/30' src={catalogInfo.imageUrl} />
						<div className='text-gray-300'>
							<h1 className='text-gray-50 text-4xl font-bold mb-6 mt-2'>{catalogInfo.title}</h1>
							<p>{catalogInfo.description}</p>
						</div>
					</div>
				</div> : <h1 className='text-gray-50 text-4xl font-bold mb-6 mt-2'>All available tasks</h1>}

				<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
						<div className="overflow-hidden ring-2 ring-white ring-opacity-5 border-2 border-crimson-200 border-opacity-80 md:rounded-lg">
							<table className="min-w-full divide-y divide-crimson-200">
								<thead className="bg-violet-500 select-none">
									<tr>
										<th scope="col" className="py-3.5 max-w-52 pl-4 pr-3 text-left text-sm font-semibold text-crimson-200 sm:pl-6">
											Title
										</th>
										{/* <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-crimson-200">
											Status
										</th> */}
										<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-crimson-200">
											Difficulty
										</th>

									</tr>
								</thead>

								<tbody className="bg-violet-400">
									{tasks.length ? tasks.map((task, taskIdx) => (
										<tr key={task.id} className={taskIdx % 2 === 0 ? undefined : 'bg-violet-300'}>
											<td className="md:max-w-80 text-nowrap md:text-wrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
												<button
													className='text-white hover:text-crimson-200 cursor-pointer'
													// href={`/tasks/${task.id}`}
													onClick={() => navigate(`/tasks/${task.id}`)}
												>
													{task.title}
												</button>
											</td>
											{/* <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
												<div className='flex items-center gap-2'>
													<div className='rounded-full w-[8px] h-[8px] bg-red-700'></div>
													<div>{task.status}</div>
												</div>
											</td> */}
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{task.difficulty}</td>
										</tr>
									)) : <NoTasks />}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
