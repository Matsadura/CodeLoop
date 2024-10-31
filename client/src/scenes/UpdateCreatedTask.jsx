import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import InputWithLabel from '../components/InputWithLabel';
import TextEreaWithLabel from '../components/TextEreaWithLabel';
import { IoAddCircleOutline } from "react-icons/io5";
import PrimaryBtn from '../components/PrimaryBtn';
import { request } from '../tools/requestModule';
import SelectWithLabel from '../components/SelectWithLable';

function NewTestCase({ testIndex, tests, setTests }) {
	const [testInput, setTestInput] = useState(tests[testIndex].input);
	const [testOutput, setTestOutput] = useState(tests[testIndex].output);
	const { taskId } = useParams();

	useEffect(() => {
		const UpdatedState = [...tests];
		UpdatedState[testIndex].input = testInput;
		UpdatedState[testIndex].output = testOutput;
		setTests(UpdatedState);
	}, [testInput, testOutput]);

	function removeTest() {
		const updatedState = [...tests];
		if (tests[testIndex]) {
			const request_header = {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			};
			request(`/tasks/${taskId}/test_cases/${tests[testIndex].testId}`, request_header);
		}
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

export default function UpdateCreatedTask({ setNav }) {
	const [tests, setTests] = useState([]);
	const [taskTitle, setTaskTitle] = useState('');
	const [taskDesc, setTaskDesc] = useState('');
	const [taskDif, setTaskDif] = useState('easy');
	const hasFetched = useRef(false);

	// errors
	const [errtaskTitle, setErrTaskTitle] = useState('');
	const [errtaskDesc, setErrTaskDesc] = useState('');
	const [errtaskDif, setErrTaskDiff] = useState('');
	const [formError, setFormError] = useState('');

	// current editing
	const { taskId } = useParams();
	const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
	if (!uuidRegex.test(taskId)) {
		return <Navigate to="/" />;
	}

	useEffect(() => {
		setNav();
	}, []);

	// Get existing task data
	useEffect(() => {
		const request_header = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};

		if (!hasFetched.current) {
			getExistingTests();
			getTaskDetails();
			hasFetched.current = true;
		}
	}, []);

	// add new task to tests state
	function addTest(input = '', output = '', testId) {
		setTests((prevState) => [...prevState, { id: testId || Date.now(), input: input, output: output, testId: testId }]);
	}

	// Download  existing tests and set tests state
	function getExistingTests() {
		if (tests.length > 0) return;
		const request_header = {
			method: 'GET',
			headers: { "Content-Type": "application/json" },
		};
		request(`/tasks/${taskId}/test_cases`, request_header).then((res) => {
			if (res.status === 403) {
				e.preventDefault();
				window.location.replace(e.currentTarget.href);
				console.error(res.data.error);
			} else {
				console.log(res.data)
				res.data.length && res.data.forEach(t => addTest(t.input, t.expected_output, t.id));
			}
		}).catch(e => console.log('Failed to fetch a test case', e));
	}

	//  Download existing task details and set task state
	function getTaskDetails() {
		const request_header = {
			method: 'GET',
			headers: { "Content-Type": "application/json" },
		};
		request(`/tasks/${taskId}`, request_header).then((res) => {
			if (res.data.id) {
				setTaskTitle(res.data.title);
				setTaskDesc(res.data.description);
				setTaskDif(res.data.difficulty);
			}
		}).catch(e => console.log('Failed to fetch task details', e));
	}

	function updateTest(input, output, testId) {
		console.log(input, output, testId);

		return new Promise((resolve, reject) => {
			const request_header = {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ input: input, expected_output: output }),
			};
			request(`/tasks/${taskId}/test_cases/${testId}`, request_header)
				.then((res) => {
					if (res.data.error) {
						setFormError(res.data.error);
						reject(res.data.error);
					} else {
						setFormError('');
						resolve();
					}
				}).catch(err => reject(err));
		});
	}

	function uploadTest(input, output) {
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
						resolve(res.id);
					}
				}).catch(err => reject(err));
		});
	}

	function updateTests() {
		Promise.all(tests.map((t, index) => {
			return t.testId ? updateTest(t.input, t.output, t.testId)
				: uploadTest(t.input, t.output, taskDif).then((i => tests[index].testId = i));
		}))
			.then(() => console.log('Updated!'))
			.catch(e => console.error(`Error updating test`, e));
	}

	function handleUpdate(e) {
		e.preventDefault();
		const taskOptions = {
			title: taskTitle,
			description: taskDesc,
			difficulty: taskDif,
		};
		if (wrongInputs()) return;
		const request_header = {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(taskOptions),
		};
		request(`/tasks/${taskId}`, request_header).then((res) => {
			if (res.data.error) setFormError(res.data.error);
			setFormError('');
			updateTests();
		});
	};




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
	return <form className="flex flex-col gap-8 max-w-[700px]">
		<InputWithLabel label='Task Title' identifier='task_lable' type='text' value={taskTitle} setValue={setTaskTitle} error={errtaskTitle} />
		<TextEreaWithLabel label='Task description (in markdown)' identifier='task_lable' type='text' value={taskDesc} setValue={setTaskDesc} error={errtaskDesc} />
		<SelectWithLabel identefier='task_difficulty' label='Task difficulty' value={taskDif} setValue={setTaskDif} error={errtaskDif}>
			<option value="easy">Easy</option>
			<option value="medium">Medium</option>
			<option value="hard">Hard</option>
		</SelectWithLabel>
		{tests.map((test, i) => {
			return <NewTestCase key={test.id} testIndex={i} tests={tests} setTests={setTests} />
		})}
		<button type='button' className='flex items-center gap-2 select-none border border-green-600 px-2 py-1 rounded-lg text-green-600 mt-5 self-end' onClick={() => addTest()} >
			<IoAddCircleOutline />
			more tests...
		</button>
		{formError.length ? <div className='bg-red-600 bg-opacity-20 text-sm text-red-600 py-2 px-4 rounded-lg'>{formError}</div> : null}
		<PrimaryBtn label='Update' type='submit' action={handleUpdate} />
	</form>
}
