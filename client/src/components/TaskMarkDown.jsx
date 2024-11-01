import { request } from '../tools/requestModule';
import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import './styles/TaskMarkDown.css';

export default function TaskMardDown({ taskId }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskBody, setTaskBody] = useState('');

  useEffect(() => {
    getTaskData(taskId);
  }, []);

  function getTaskData(catalog_id) {
    const request_header = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    request(`/tasks/${taskId}`, request_header).then((res) => {
      setTaskTitle(res.data.title);
      setTaskBody(res.data.description);
    });
  }

  return <div>
    <header>
      <h1 className='bg-violet-500 text-wrap border-b px-4 py-6 text-2xl text-gray-50 font-bold'>{taskTitle}</h1>
    </header>
    <main className='task__markdown text-gray-200 p-4'>
      <Markdown>{taskBody}</Markdown>
    </main>
  </div>
}
