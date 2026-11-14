import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { IoAddCircleOutline } from 'react-icons/io5';
import InputWithLabel from '../components/InputWithLabel';
import TextEreaWithLabel from '../components/TextEreaWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import FormMessage from '../components/FormMessage';
import PageStatus from '../components/PageStatus';
import SelectWithLabel from '../components/SelectWithLable';
import TestCaseFields from '../components/TestCaseFields';
import { validateTaskForm } from '../tools/taskForm';
import { requestJson } from '../tools/requestModule';

let nextId = 1;
const newTest = () => ({ id: `new-${nextId++}`, input: '', output: '', testId: null });


export default function UpdateCreatedTask() {
	const { taskId } = useParams();
	const [tests, setTests] = useState([]);
	const [taskTitle, setTaskTitle] = useState('');
	const [taskDesc, setTaskDesc] = useState('');
	const [taskDif, setTaskDif] = useState('easy');
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [errors, setErrors] = useState({});
	const [formError, setFormError] = useState('');
	const [success, setSuccess] = useState('');
	const [saving, setSaving] = useState(false);


	useEffect(() => {
		let active = true;
		async function load() {
			setLoading(true);
			const [taskRes, testsRes] = await Promise.all([
				requestJson(`/tasks/${taskId}`),
				requestJson(`/tasks/${taskId}/test_cases`),
			]);
			if (!active) return;
			if (!taskRes.ok) {
				setLoadError(taskRes.status === 404 ? 'This task does not exist.' : taskRes.data.error);
			} else if (testsRes.status === 403) {
				setLoadError('Only the author of this task can edit it.');
			} else if (!testsRes.ok) {
				setLoadError(testsRes.data.error);
			} else {
				setTaskTitle(taskRes.data.title);
				setTaskDesc(taskRes.data.description);
				setTaskDif(taskRes.data.difficulty);
				setTests(testsRes.data.map((t) => ({ id: t.id, input: t.input, output: t.expected_output, testId: t.id })));
			}
			setLoading(false);
		}
		load();
		return () => { active = false; };
	}, [taskId]);

	function updateTest(updated) {
		setTests((current) => current.map((t) => (t.id === updated.id ? updated : t)));
	}

	async function removeTest(removed) {
		if (removed.testId) {
			const res = await requestJson(`/tasks/${taskId}/test_cases/${removed.testId}`, 'DELETE');
			if (!res.ok) {
				setFormError(res.data.error);
				return;
			}
		}
		setTests((current) => current.filter((t) => t.id !== removed.id));
	}

	async function saveTests() {
		for (const test of tests) {
			const body = { input: test.input, expected_output: test.output };
			const res = test.testId
				? await requestJson(`/tasks/${taskId}/test_cases/${test.testId}`, 'PUT', body)
				: await requestJson(`/tasks/${taskId}/test_cases`, 'POST', body);
			if (!res.ok) return res.data.error;
			if (!test.testId) {
				setTests((current) => current.map((t) => (t.id === test.id ? { ...t, testId: res.data.id } : t)));
			}
		}
		return '';
	}

	async function handleUpdate(e) {
		e.preventDefault();
		if (saving) return;
		setSuccess('');
		const { errors: found, form } = validateTaskForm({
			title: taskTitle, description: taskDesc, difficulty: taskDif, tests, requireCategory: false,
		});
		setErrors(found);
		setFormError(form);
		if (form) return;

		setSaving(true);
		const res = await requestJson(`/tasks/${taskId}`, 'PUT', {
			title: taskTitle.trim(),
			description: taskDesc,
			difficulty: taskDif,
		});
		const error = res.ok ? await saveTests() : res.data.error;
		setSaving(false);
		if (error) setFormError(error);
		else setSuccess('Task updated!');
	}

	if (loading) return <PageStatus loading message='Loading task...' />;
	if (loadError) return <PageStatus error={loadError} />;

	return <form className='flex flex-col gap-8 max-w-[700px]' onSubmit={handleUpdate} noValidate>
		<InputWithLabel label='Task Title' identifier='task_title' value={taskTitle} setValue={setTaskTitle} error={errors.title} required maxLength={255} />
		<TextEreaWithLabel label='Task description (in markdown)' identifier='task_description' rows={8} value={taskDesc} setValue={setTaskDesc} error={errors.description} required />
		<SelectWithLabel identifier='task_difficulty' label='Task difficulty' value={taskDif} setValue={setTaskDif} error={errors.difficulty}>
			<option value='easy'>Easy</option>
			<option value='medium'>Medium</option>
			<option value='hard'>Hard</option>
		</SelectWithLabel>
		{tests.map((test, i) => <TestCaseFields key={test.id} test={test} index={i} onChange={updateTest} onRemove={removeTest} confirmRemove />)}
		<button type='button' className='flex items-center gap-2 select-none border border-green-600 px-2 py-1 rounded-lg text-green-600 mt-5 self-end' onClick={() => setTests((t) => [...t, newTest()])}>
			<IoAddCircleOutline aria-hidden='true' />
			more tests...
		</button>
		<FormMessage error={formError} success={success} />
		<PrimaryBtn label={saving ? 'Saving...' : 'Update'} disabled={saving} />
	</form>
}
