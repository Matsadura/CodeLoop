import { useEffect } from 'react';

const tasks = [
	{
		id: 1,
		title: 'Cpu is important',
		status: 'Error',
		difficulty: 'HARD'
	},
	{ id: 2, title: 'Werite your own shell', status: 'Done', difficulty: 'HARD' },
	{ id: 3, title: 'Lindsay Walton', status: 'Compile error', difficulty: 'HARD' },
	{ id: 4, title: 'Lindsay Walton', status: 'SegFault', difficulty: 'HARD' },
	{ id: 5, title: 'Lindsay Walton', status: 'Done', difficulty: 'HARD' },
]

export default function Tasks({ setNav }) {
	useEffect(() => setNav(), []);

	return (
		<div className="px-4 sm:px-6 lg:px-8">
			<div className="mt-8 flex flex-col">
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
											Status
										</th>
										<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-crimson-200">
											Difficulty
										</th>

									</tr>
								</thead>
								<tbody className="bg-violet-400">
									{tasks.map((task, taskIdx) => (
										<tr key={task.id} className={taskIdx % 2 === 0 ? undefined : 'bg-violet-300'}>
											<td className="md:max-w-80 text-nowrap md:text-wrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
												<a
													className='text-white hover:text-crimson-200 cursor-pointer'
													href={`/catalogs/15/tasks/${task.id}`}
												>
													{task.title}
												</a>
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
												<div className='flex items-center gap-2'>
													<div className='rounded-full w-[8px] h-[8px] bg-red-700'></div>
													<div>{task.status}</div>
												</div>
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{task.difficulty}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
