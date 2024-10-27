import Markdown from 'react-markdown';
import './styles/TaskMarkDown.css';
import { useEffect, useState } from 'react';


export default function TaskMardDown(title) {
  const [Task, setTask] = useState('');

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/ila36IX/Notes/refs/heads/main/Python/SQLAlchemy/SQLAlchemy.md')
      .then(r => r.blob())
      .then(blob => blob.text())
      .then(text => setTask(text))
  }, [])

  return <div>
    <header>
      <h1 className='bg-violet-500 text-wrap border-b px-4 py-6 text-2xl text-gray-50 font-bold'>Hello world!</h1>
    </header>
    <main className='task__markdown text-gray-200 p-4'>
      <Markdown>{Task}</Markdown>
    </main>
  </div>
}
