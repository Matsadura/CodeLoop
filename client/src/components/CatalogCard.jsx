
import { MdArrowRightAlt } from "react-icons/md";
// import { IoIosArrowDroprightCircle } from "react-icons/io";
import { MdArrowForward } from "react-icons/md";


const catalogs = [
  {
    id: 5,
    title: 'Learn about parsing shell commands, executing programs and more',
    description: 'Learn about parsing shell commands, executing programs and more',
    tasksCount: 61,
    difficulty: 'hard',
    imageUrl:
      'https://www.britefish.net/wp-content/uploads/2019/07/logo-c-1.png',
  },
  {
    id: 5,
    title: 'Learn about parsing shell commands, executing programs and more',
    description: 'Learn about parsing shell commands, executing programs and more',
    tasksCount: 61,
    difficulty: 'hard',
    imageUrl:
      'https://www.britefish.net/wp-content/uploads/2019/07/logo-c-1.png',
  },
  {
    id: 5,
    title: 'Learn about parsing shell commands, executing programs and more',
    description: 'Learn about parsing shell commands, executing programs and more',
    tasksCount: 61,
    difficulty: 'hard',
    imageUrl:
      'https://www.britefish.net/wp-content/uploads/2019/07/logo-c-1.png',
  },
  {
    id: 5,
    title: 'Learn about parsing shell commands, executing programs and more',
    description: 'Learn about parsing shell commands, executing programs and more',
    tasksCount: 61,
    difficulty: 'hard',
    imageUrl:
      'https://www.britefish.net/wp-content/uploads/2019/07/logo-c-1.png',
  },
  {
    id: 5,
    title: 'Learn about parsing shell commands, executing programs and more',
    description: 'Learn about parsing shell commands, executing programs and more',
    tasksCount: 61,
    difficulty: 'hard',
    imageUrl:
      'https://www.britefish.net/wp-content/uploads/2019/07/logo-c-1.png',
  },
  {
    id: 5,
    title: 'Write your Libft',
    description: 'Your own library is not that hard',
    tasksCount: 61,
    difficulty: 'hard',
    imageUrl:
      'https://www.britefish.net/wp-content/uploads/2019/07/logo-c-1.png',
  },
  
]

export default function Example() {
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
            </div>
            <img className="h-20 w-20 flex-shrink-0 bg-violet-500" src={catalog.imageUrl} alt="" />
          </div>
          <div className="">
            <div className="-mt-px flex">
              
              <div className="flex w-0 flex-1">
                <div
                  className="relative -mr-px ml-4 inline-flex w-0 flex-1 gap-1 items-center justify-start rounded-bl-lg border border-transparent py-4 text-sm font-medium text-gray-400"
                >
                  <MdArrowRightAlt />
                  <span className="">Tasks</span>
                  <span className="">{catalog.tasksCount}</span>
                </div>
              </div>
             
              <div className="flex w-0 flex-1">
                <a
                  href={`catalogs/id`}
                  className="relative mr-4 inline-flex w-0 flex-1 items-center justify-end rounded-bl-lg border border-transparent py-4 text-sm font-medium text-white hover:text-crimson-200"
                >
                  <span className="ml-3 text-lg">Start</span>
                  <MdArrowRightAlt className="text-2xl"/>
                </a>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
