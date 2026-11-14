import { requestJson } from '../tools/requestModule';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MdFavoriteBorder } from 'react-icons/md';
import { MdOutlineFavorite } from 'react-icons/md';
import { PiSmileyMehLight } from 'react-icons/pi';
import { FaSort } from 'react-icons/fa';
import PageStatus from '../components/PageStatus';


function NoTasks() {
	return <tr className='bg-violet-300'>
		<td className='col-span-full text-center py-8' colSpan='3'>
			<span className='text-3xl  font-bold text-gray-50'>Empty buffer :(</span>
			<Link to='/task/create' className='text-crimson-200 block mt-4'>Be the first creator</Link>
		</td>
	</tr>
}

export default function Tasks() {
	const { id_catalog } = useParams();
	const [tasks, setTasks] = useState([]);
	const [favoriteIds, setFavoriteIds] = useState(new Set());
	const [catalogInfo, setCatalogInfo] = useState(null);
	const [sortDesc, setSOrtDesc] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [attempt, setAttempt] = useState(0);
	const navigate = useNavigate();



	useEffect(() => {
		let active = true;
		async function load() {
			setLoading(true);
			setError('');
			const tasksUrl = id_catalog ? `/categories/${id_catalog}/tasks` : '/tasks';
			const [tasksRes, favoritesRes, catalogsRes] = await Promise.all([
				requestJson(tasksUrl),
				requestJson('/users/favorites'),
				id_catalog ? requestJson('/categories') : Promise.resolve(null),
			]);
			if (!active) return;
			if (!tasksRes.ok) {
				setError(tasksRes.status === 404 ? 'This catalog does not exist.' : tasksRes.data.error);
			} else {
				setTasks(tasksRes.data);
			}
			if (favoritesRes.ok) setFavoriteIds(new Set(favoritesRes.data.map((f) => f.task_id)));
			if (catalogsRes && catalogsRes.ok) setCatalogInfo(catalogsRes.data.find((c) => c.id === id_catalog) || null);
			setLoading(false);
		}
		load();
		return () => { active = false; };
	}, [id_catalog, attempt]);

	function sortByLikes() {
		if (sortDesc) {
			setSOrtDesc(false);
			setTasks(t => [...t].sort((a, b) => b.favoritesCount - a.favoritesCount));
		} else {
			setTasks(t => [...t].sort((a, b) => a.favoritesCount - b.favoritesCount));
			setSOrtDesc(true);
		}
	}

	if (loading) return <PageStatus loading message='Loading tasks...' />;
	if (error) return <PageStatus error={error} onRetry={() => setAttempt((a) => a + 1)} />;

	return (
		<div className='px-4 sm:px-6 lg:px-8'>
			<div className='mt-8 flex flex-col'>
				{catalogInfo ? <div className='mb-8'>
					<div className='flex flex-col sm:flex-row gap-6 sm:gap-12'>
						<img className='h-52 w-fit rounded-md border border-crimson-200/30' src={catalogInfo.imageUrl} alt='' />
						<div className='text-gray-300'>
							<h1 className='text-gray-50 text-4xl font-bold mb-6 mt-2'>{catalogInfo.title}</h1>
							<p>{catalogInfo.description}</p>
						</div>
					</div>
				</div> : <h1 className='text-gray-50 text-4xl font-bold mb-6 mt-2'>All available tasks</h1>}

				<div className='-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8'>
					<div className='inline-block min-w-full py-2 align-middle md:px-6 lg:px-8'>
						<div className='overflow-hidden ring-2 ring-white ring-opacity-5 border-2 border-crimson-200 border-opacity-80 md:rounded-lg'>
							<table className='min-w-full divide-y divide-crimson-200'>
								<thead className='bg-violet-500 select-none'>
									<tr>
										<th scope='col' className='py-3.5 max-w-52 pl-4 pr-3 text-left text-sm font-semibold text-crimson-200 sm:pl-6'>
											Title
										</th>
										<th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-crimson-200'>
											Difficulty
										</th>
										<th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-crimson-200'>
											<button type='button' className='rounded-md hover:text-crimson-100 flex items-center gap-1' onClick={sortByLikes}>Likes<FaSort aria-hidden='true' /></button>
										</th>
									</tr>
								</thead>
								<tbody className='bg-violet-400'>
									{tasks.length ? tasks.map((task, taskIdx) => (
										<tr key={task.id} className={taskIdx % 2 === 0 ? undefined : 'bg-violet-300'}>
											<td className='md:max-w-80 text-nowrap md:text-wrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6'>
												<button
													type='button'
													className='text-white hover:text-crimson-200 cursor-pointer text-start'
													onClick={() => navigate(`/tasks/${task.id}`)}
												>
													{task.title}
												</button>
											</td>
											<td className='whitespace-nowrap px-3 py-4 text-sm text-gray-300'>{task.difficulty}</td>
											<td className='whitespace-nowrap px-3 py-4 text-sm text-gray-300'>
												<Likes taskId={task.id} likesCount={task.favoritesCount} initiallyLiked={favoriteIds.has(task.id)} />
											</td>
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

const MAX_LIKE_TOGGLES = 8;

function Likes({ taskId, likesCount, initiallyLiked }) {
	const [like, setLike] = useState(initiallyLiked);
	const [currCount, setCurrCount] = useState(likesCount);
	const [clicks, setClicks] = useState(0);
	const [busy, setBusy] = useState(false);

	async function handleLike() {
		if (busy || clicks >= MAX_LIKE_TOGGLES) return;
		setBusy(true);
		const res = await requestJson('/users/favorites', like ? 'DELETE' : 'POST', { task_id: taskId });
		// 409/404 mean the server already had the requested state.
		if (res.ok || res.status === 409 || res.status === 404) {
			const liked = !like;
			setLike(liked);
			if (res.ok) setCurrCount((c) => (liked ? c + 1 : Math.max(0, c - 1)));
			setClicks((c) => c + 1);
		}
		setBusy(false);
	}

	return <div className='flex items-center gap-2 select-none'>
		{clicks >= MAX_LIKE_TOGGLES ? <PiSmileyMehLight className='text-xl' aria-label='Too many clicks' /> :
			<button type='button' className='hover:text-crimson-100 text-crimson-200' onClick={handleLike} disabled={busy}
				aria-pressed={like} aria-label={like ? 'Remove from favorites' : 'Add to favorites'}>
				{like ? <MdOutlineFavorite className='text-xl' aria-hidden='true' /> : <MdFavoriteBorder className='text-xl' aria-hidden='true' />}
			</button>}
		<span className='w-10'>{currCount}</span>
	</div>
}
