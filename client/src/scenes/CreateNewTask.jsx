import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { useEffect } from 'react';
import InputWithLabel from '../components/InputWithLabel';
import TextEreaWithLabel from '../components/TextEreaWithLabel';
import { useState } from 'react';
import { IoAddCircleOutline } from "react-icons/io5";

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
		<button className='border border-red-600 px-2 py-1 rounded-lg text-red-600 mt-5 self-end' onClick={removeTest}>

			Remove this test
		</button>
	</div>

}


export default function CreateNewTask({ setNav }) {
	const [tests, setTests] = useState([{ id: Date.now(), input: '"leet"', output: '"1337"' }]);

	useEffect(() => {
		setNav();
		console.log('lenght', tests.length);
	}, []);

	function addTest(e) {
		e.preventDefault()
		const updatedState = [...tests];
		updatedState.push({ id: Date.now(), input: '', output: '' });
		setTests(updatedState);
	}


	return (
		<form className="flex flex-col jusstify-center mx-auto gap-8 max-w-[700px]">
			<InputWithLabel label='Task Title' identifier='task_lable' type='text' />
			<TextEreaWithLabel label='Task description (in markdown)' identifier='task_lable' type='text' />
			{tests.map((test, i) => {
				return <NewTestCase key={test.id} testIndex={0} tests={tests} setTests={setTests} />
			})}
			<button className='flex items-center gap-2  border border-green-600 px-2 py-1 rounded-lg text-green-600 mt-5 self-end' onClick={addTest} >
				<IoAddCircleOutline />
				more
			</button>
		</form>
	)

}
