import { requestJson } from '../tools/requestModule';
import { Link, useNavigate } from 'react-router-dom';
import { TiArrowRight } from 'react-icons/ti';
import { useEffect, useState } from 'react';
import { FaTasks } from 'react-icons/fa';
import PageStatus from './PageStatus';


export default function CatalogCards() {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();


  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    requestJson('/categories').then((res) => {
      if (!active) return;
      if (res.ok) setCatalogs(res.data);
      else setError(res.data.error);
      setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);

  if (loading) return <PageStatus loading message='Loading catalogs...' />;
  if (error) return <PageStatus error={error} onRetry={() => setAttempt((a) => a + 1)} />;
  if (!catalogs.length) {
    return <PageStatus message='No catalogs yet. '>
      <Link className='text-crimson-200 underline' to='/catalog/create'>Create the first one</Link>
    </PageStatus>;
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {catalogs.map((catalog) => (
        <li key={catalog.id} className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg border bg-violet-400 shadow justify-between">
          <div className="flex w-full items-center justify-between space-x-6 p-6">
            <div className="w-[80%]">
              <div className="flex items-center">
                <h3 className="text-xl font-medium text-gray-50">{catalog.title}</h3>
              </div>
              <p className="mt-1 text-sm text-gray-300">{catalog.description}</p>
              <span className="inline-block opacity-75 mt-5 border text-center text-gray-50 border-gray-50 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
                {catalog.difficulty}
              </span>
            </div>
            <div className="flex flex-col justify-center items-center gap-2">
              <div className="h-20 w-20 overflow-hidden">
                <img className="w-full flex-shrink-0 bg-violet-500" src={catalog.imageUrl} alt="" />
              </div>
            </div>
          </div>
          <div className="">
            <div className="-mt-px flex items-center">
              <div className="flex w-0 flex-1">
                <div
                  className="relative -mr-px ml-4 inline-flex w-0 flex-1 gap-1 items-center justify-start rounded-bl-lg border border-transparent py-4 text-sm font-medium text-gray-400"
                >
                  <FaTasks className="text-lg mr-1" aria-hidden="true" />
                  <span className="text-xs">{catalog.tasksCount}</span>
                  <span className="text-xs">{catalog.tasksCount === 1 ? 'task' : 'tasks'}</span>
                </div>
              </div>
              <div className="flex w-0 flex-1">
                <button
                  type="button"
                  aria-label={`Start ${catalog.title}`}
                  onClick={() => navigate(`/catalogs/${catalog.id}/tasks`)}
                  className="relative mr-4 inline-flex w-0 flex-1 items-center font-bold justify-end rounded-bl-lg border border-transparent py-4 text-sm text-crimson-200 hover:text-crimson-100"
                >
                  <span className="ml-3 text-sm">Start</span>
                  <TiArrowRight className="text-2xl" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
