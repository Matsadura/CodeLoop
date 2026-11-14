import { useEffect, useState } from 'react';
import { IoAddCircleOutline } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router-dom';
import InputWithLabel from '../components/InputWithLabel';
import TextEreaWithLabel from '../components/TextEreaWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import FormMessage from '../components/FormMessage';
import SelectWithLabel from '../components/SelectWithLable';
import TestCaseFields from '../components/TestCaseFields';
import { validateTaskForm } from '../tools/taskForm';
import { requestJson } from '../tools/requestModule';

let nextId = 1;
const newTest = (input = '', output = '') => ({ id: `new-${nextId++}`, input, output });


export default function CreateNewTask() {
	const [tests, setTests] = useState(() => [newTest('"leet"', '"1337"')]);
	const [taskTitle, setTaskTitle] = useState('');
	const [taskDesc, setTaskDesc] = useState('');
	const [taskDif, setTaskDif] = useState('easy');
	const [catalogs, setCatalogs] = useState([]);
	const [catalogsError, setCatalogsError] = useState('');
	const [catalogId, setCatalogId] = useState('');
	const [errors, setErrors] = useState({});
	const [formError, setFormError] = useState('');
	const [createdTaskId, setCreatedTaskId] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const navigate = useNavigate();


	useEffect(() => {
		requestJson('/categories').then((res) => {
			if (res.ok) setCatalogs(res.data);
			else setCatalogsError(res.data.error);
		});
	}, []);

	function updateTest(updated) {
		setTests((current) => current.map((t) => (t.id === updated.id ? updated : t)));
	}

	function removeTest(removed) {
		setTests((current) => current.filter((t) => t.id !== removed.id));
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (submitting) return;
		const { errors: found, form } = validateTaskForm({
			title: taskTitle, description: taskDesc, difficulty: taskDif, categoryId: catalogId, tests,
		});
		setErrors(found);
		setFormError(form);
		if (form) return;

		setSubmitting(true);
		const res = await requestJson('/tasks', 'POST', {
			title: taskTitle.trim(),
			description: taskDesc,
			difficulty: taskDif,
			category_id: catalogId,
		});
		if (!res.ok) {
			setFormError(res.data.error);
			setSubmitting(false);
			return;
		}
		const taskId = res.data.id;
		// Upload sequentially so the first failure is reported clearly.
		for (const test of tests) {
			const testRes = await requestJson(`/tasks/${taskId}/test_cases`, 'POST', { input: test.input, expected_output: test.output });
			if (!testRes.ok) {
				setCreatedTaskId(taskId);
				setFormError(`The task was created but a test case could not be saved: ${testRes.data.error}`);
				setSubmitting(false);
				return;
			}
		}
		navigate(`/tasks/${taskId}`);
	}

	return (
		<form className='flex flex-col gap-8 max-w-[700px]' onSubmit={handleSubmit} noValidate>
			<InputWithLabel label='Task Title' identifier='task_title' value={taskTitle} setValue={setTaskTitle} error={errors.title} required maxLength={255} />
			<TextEreaWithLabel label='Task description (in markdown)' identifier='task_description' rows={8} value={taskDesc} setValue={setTaskDesc} error={errors.description} required />
			<SelectWithLabel identifier='task_difficulty' label='Task difficulty' value={taskDif} setValue={setTaskDif} error={errors.difficulty}>
				<option value='easy'>Easy</option>
				<option value='medium'>Medium</option>
				<option value='hard'>Hard</option>
			</SelectWithLabel>
			<SelectWithLabel identifier='task_category' label='Task Category' value={catalogId} setValue={setCatalogId} error={errors.category || catalogsError}>
				<option value='' disabled>Please select a category</option>
				{catalogs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
			</SelectWithLabel>
			{!catalogsError && catalogs.length === 0 ?
				<p className='text-sm text-gray-300'>No catalogs yet. <Link className='text-crimson-200 underline' to='/catalog/create'>Create one first</Link>.</p> : null}
			{tests.map((test, i) => <TestCaseFields key={test.id} test={test} index={i} onChange={updateTest} onRemove={removeTest} />)}
			<button type='button' className='flex items-center gap-2 select-none border border-green-600 px-2 py-1 rounded-lg text-green-600 mt-5 self-end' onClick={() => setTests((t) => [...t, newTest()])}>
				<IoAddCircleOutline aria-hidden='true' />
				more tests...
			</button>
			<FormMessage error={formError} />
			{createdTaskId ? <Link className='text-crimson-200 underline' to={`/task/${createdTaskId}/update`}>Fix the test cases on the edit page</Link> : null}
			<PrimaryBtn label={submitting ? 'Creating...' : 'Submit'} disabled={submitting || Boolean(createdTaskId)} />
		</form>
	)
}
