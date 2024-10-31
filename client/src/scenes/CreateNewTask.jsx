import { useEffect } from 'react';
import InputWithLabel from '../components/InputWithLabel';
import TextEreaWithLabel from '../components/TextEreaWithLabel';
import { useState } from 'react';
import { IoAddCircleOutline } from "react-icons/io5";
import PrimaryBtn from '../components/PrimaryBtn';
import { request } from '../tools/requestModule';
import SelectWithLabel from '../components/SelectWithLable';
import { useNavigate } from 'react-router-dom';


function NewTestCase({ testIndex, tests, setTests }) {
	const [testInput, setTestInput] = useState(tests[testIndex].input);
	const [testOutput, setTestOutput] = useState(tests[testIndex].output);

	useEffect(() => {
		const UpdatedState = [...tests];
		UpdatedState[testIndex].input = testInput;
		UpdatedState[testIndex].output = testOutput;
		setTests(UpdatedState);
	}, [testInput, testOutput]);

	function removeTest() {
		const updatedState = [...tests];
		updatedState.splice(testIndex, 1);
		setTests(updatedState);
	}

	return <div className='border border-crimson-200 border-opacity-40 p-4 rounded-lg flex flex-col gap-4'>
		<p className='text-crimson-200 underline text-lg'>Your test goes Here</p>
		<TextEreaWithLabel label='Input test' identifier='task_input' type='text' value={testInput} setValue={setTestInput} />
		<TextEreaWithLabel label='Expected output' identifier='task_output' type='text' value={testOutput} setValue={setTestOutput} />

		<button type='button' className='border border-red-600 px-2 py-1 rounded-lg text-red-600 mt-5 self-start' onClick={removeTest}>
			Remove
		</button>
	</div>
}


export default function CreateNewTask({ setNav }) {
	const [tests, setTests] = useState([{ id: Date.now(), input: '"leet"', output: '"1337"' }]);
	const [taskTitle, setTaskTitle] = useState('');
	const [taskDesc, setTaskDesc] = useState('');
	const [taskDif, setTaskDif] = useState('easy');
	const [catalogs, setCatalogs] = useState([]);
	const [catalogId, setCatalogId] = useState('');
	const navigate = useNavigate();

	// errors
	const [errtaskTitle, setErrTaskTitle] = useState('');
	const [errtaskDesc, setErrTaskDesc] = useState('');
	const [errtaskDif, setErrTaskDiff] = useState('');
	const [errtaskCatalog, setErrTaskCatalog] = useState('');
	const [formError, setFormError] = useState('');

	useEffect(() => {
		setNav();
	}, []);

	// Get cateories
	useEffect(() => {
		const request_header = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
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

	function addTest() {
		const updatedState = [...tests];
		updatedState.push({ id: Date.now(), input: '', output: '' });
		setTests(updatedState);
	}

	// function uploadTest(input, output, taskId) {
	// 	const request_header = {
	// 		method: "POST",
	// 		headers: { "Content-Type": "application/json" },
	// 		body: JSON.stringify({ input: input, expected_output: output }),
	// 	};
	// 	request(`/tasks/${taskId}/test_cases`, request_header).then((res) => {
	// 		if (res.data.error) setFormError(res.data.error);
	// 		else setFormError('');
	// 	});
	// }
	function uploadTest(input, output, taskId) {
		return new Promise((resolve, reject) => {
			const request_header = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ input: input, expected_output: output }),
			};
			request(`/tasks/${taskId}/test_cases`, request_header)
				.then((res) => {
					if (res.data.error) {
						setFormError(res.data.error);
						reject(res.data.error);
					} else {
						setFormError('');
						resolve();
					}
				})
				.catch((err) => {
					reject(err);
				});
		});
	}


	function handleSubmit(e) {
		e.preventDefault();
		if (wrongInputs()) return;
		const taskOptions = {
			title: taskTitle,
			description: taskDesc,
			difficulty: taskDif,
			category_id: catalogId
		};
		// console.log(taskOptions);
		const request_header = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(taskOptions),
		};
		request('/tasks', request_header).then((res) => {
			if (res.data.error) setFormError(res.data.error);
			else {
				const createdTaskId = res.data.id;

				setFormError('');
				// tests.forEach((test) => {
				// 	uploadTest(test.input, test.output, createdTaskId);
				// });
				Promise.all(tests.map((test) =>
					uploadTest(test.input, test.output, createdTaskId)
				)).then(() => { navigate(`/tasks/${createdTaskId}`) })
					.catch((error) => {
						console.error("Error uploading tests:", error);
					});
			}
		});
	}

	function wrongInputs() {
		let errFound = false;

		if (!taskTitle.length) {
			setErrTaskTitle('Please  enter a task title');
			errFound = true;
		} else setErrTaskTitle('');

		if (!taskDesc.length) {
			setErrTaskDesc('Please enter a task description');
			errFound = true;
		} else setErrTaskDesc('');
		if (!taskDif.length) {
			setErrTaskDiff('Please select a task difficalty');
			errFound = true;
		} else setErrTaskDiff('');
		if (!catalogId.length) {
			setErrTaskCatalog('Please select a task catalog');
			errFound = true;
		} else setErrTaskCatalog('');

		if (errFound) {
			setFormError('Please complete all fields!');
			return true;
		} else setFormError('');

		if (!tests.length) {
			setFormError('At least one test for a task');
			return true;
		} else setFormError('');

		let emptyTest = false;
		tests.map((test) => {
			if (!test.input.length || !test.output.length) emptyTest = true;
		});

		if (emptyTest) {
			setFormError('Fill in all test inputs and outputs, or submit "None" (without quotes) if no input is needed.');
			errFound = true;
		} else setFormError('');

		return errFound;
	}

	return (
		<form className="flex flex-col gap-8 max-w-[700px]">
			<InputWithLabel label='Task Title' identifier='task_lable' type='text' value={taskTitle} setValue={setTaskTitle} error={errtaskTitle} />
			<TextEreaWithLabel label='Task description (in markdown)' identifier='task_lable' type='text' value={taskDesc} setValue={setTaskDesc} error={errtaskDesc} />
			<SelectWithLabel identefier='task_difficulty' label='Task difficulty' value={taskDif} setValue={setTaskDif} error={errtaskDif}>
				<option value="easy">Easy</option>
				<option value="medium">Medium</option>
				<option value="hard">Hard</option>
			</SelectWithLabel>
			<SelectWithLabel identefier='task_category' label='Task Category' value={catalogId} setValue={setCatalogId} error={errtaskCatalog}>
				{catalogs.map((c, i) => <option key={c.id} value={c.id} >{c.title}</option>)}
				<option value='' disabled>Please  select a category</option>
			</SelectWithLabel>
			{tests.map((test, i) => {
				return <NewTestCase key={test.id} testIndex={i} tests={tests} setTests={setTests} />
			})}
			<button type='button' className='flex items-center gap-2 select-none border border-green-600 px-2 py-1 rounded-lg text-green-600 mt-5 self-end' onClick={addTest} >
				<IoAddCircleOutline />
				more tests...
			</button>
			{formError.length ? <div className='bg-red-600 bg-opacity-20 text-sm text-red-600 py-2 px-4 rounded-lg'>{formError}</div> : null}
			<PrimaryBtn label='Submit' type={'submit'} action={handleSubmit} />
		</form>
	)
}
