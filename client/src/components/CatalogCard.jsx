
import { request } from '../tools/requestModule';
import { useNavigate } from 'react-router-dom';
import { TiArrowRight } from 'react-icons/ti';
import { useEffect, useState } from 'react';
import { FaTasks } from 'react-icons/fa';



// const catalogs = [
//   {
//     id: 5,
//     title: 'Write your Libft',
//     description: 'Your own library is not that Hard',
//     tasksCount: 61,
//     difficulty: 'HARD',
//     imageUrl:
//       'https://www.britefish.net/wp-content/uploads/2019/07/logo-c-1.png',
//   }
// ]

export default function CatalogCards({ setNav }) {
  const [catalogs, setCatalogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { setNav() }, []);

  useEffect(() => {
    const request_header = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    };
    getCatalogs();
  }, []);

  function getCatalogs() {
    const request_header = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    request('/categories', request_header).then((res) => {
      setCatalogs(res.data);
    });
  }


  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {catalogs.map((catalog) => (
        <li key={catalog.id} className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg border bg-violet-400 shadow justify-between">
          <div className="flex w-full items-center justify-between space-x-6 p-6">
            <div className="w-[80%]">
              <div className="flex items-center">
                <h3 className="text-xl font-medium text-gray-50">{catalog.title}</h3>
                {/* <span className="inline-block flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-gray-100">
                  {catalog.difficulty}
                </span> */}
              </div>
              <p className="mt-1 text-sm text-gray-500">{catalog.description}</p>
              <span className="inline-block opacity-75 mt-5 border text-center text-gray-50 border-gray-50 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
                {catalog.difficulty}
              </span>
            </div>
            <div className="flex flex-col justify-center items-center gap-2">
              <div className="h-20 w-20 overflow-hidden">
                <img className="w-full flex-shrink-0 bg-violet-500" src={catalog.imageUrl} alt="" />
              </div>
              {/* <span className="inline-block flex-shrink-0 rounded-full bg-violet-200 px-2 py-0.5 text-xs font-medium text-gray-100">
                {catalog.difficulty}
              </span> */}
            </div>
          </div>
          <div className="">
            <div className="-mt-px flex items-center">
              <div className="flex w-0 flex-1">
                <div
                  className="relative -mr-px ml-4 inline-flex w-0 flex-1 gap-1 items-center justify-start rounded-bl-lg border border-transparent py-4 text-sm font-medium text-gray-400"
                >
                  <FaTasks className="text-lg mr-1" />
                  <span className="text-xs">{catalog.tasksCount}</span>
                  <span className="text-xs">task</span>
                </div>
              </div>
              <div className="flex w-0 flex-1">
                <button
                  onClick={() => navigate(`/catalogs/${catalog.id}/tasks`)}
                  className="relative mr-4 inline-flex w-0 flex-1 items-center font-bold justify-end rounded-bl-lg border border-transparent py-4 text-sm text-crimson-200 hover:text-crimson-100"
                >
                  <span className="ml-3 text-sm">Start</span>
                  <TiArrowRight className="text-2xl" />
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
