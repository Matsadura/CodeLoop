/** Client-side validation shared by the create and update forms */
export function validateTaskForm({ title, description, difficulty, categoryId, tests, requireCategory = true }) {
	const errors = {};
	if (!title.trim()) errors.title = 'Please enter a task title';
	if (!description.trim()) errors.description = 'Please enter a task description';
	if (!difficulty) errors.difficulty = 'Please select a task difficulty';
	if (requireCategory && !categoryId) errors.category = 'Please select a task catalog';
	let form = '';
	if (Object.keys(errors).length) form = 'Please complete all fields!';
	else if (!tests.length) form = 'Add at least one test for the task.';
	else if (tests.some((t) => !t.input.trim() || !t.output.trim())) {
		form = 'Fill in all test inputs and outputs, or submit "None" (without quotes) if no input is needed.';
	} else {
		const inputs = tests.map((t) => t.input);
		if (new Set(inputs).size !== inputs.length) form = 'Two test cases have the same input.';
	}
	return { errors, form };
}
