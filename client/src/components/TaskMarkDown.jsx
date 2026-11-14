import { requestJson } from '../tools/requestModule';
import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import PageStatus from './PageStatus';
import './styles/TaskMarkDown.css';

export default function TaskMardDown({ taskId }) {
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    requestJson(`/tasks/${taskId}`).then((res) => {
      if (!active) return;
      if (res.ok) setTask(res.data);
      else setError(res.status === 404 ? 'This task does not exist (anymore).' : res.data.error);
    });
    return () => { active = false; };
  }, [taskId, attempt]);

  if (error) return <PageStatus error={error} onRetry={() => setAttempt((a) => a + 1)} />;
  if (!task) return <PageStatus loading message='Loading task...' />;

  return <div>
    <header>
      <h1 className='bg-violet-500 text-wrap border-b px-4 py-6 text-2xl text-gray-50 font-bold'>{task.title}</h1>
    </header>
    <main className='task__markdown text-gray-200 p-4'>
      {/* react-markdown does not render raw HTML, so task content cannot inject scripts. */}
      <Markdown>{task.description}</Markdown>
    </main>
  </div>
}
