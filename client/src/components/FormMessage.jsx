/** Inline form feedback (error or success). */
export default function FormMessage({ error, success }) {
	if (error) {
		return <div role='alert' className='bg-red-600 bg-opacity-20 text-sm text-red-400 py-2 px-4 rounded-lg border border-red-600'>{error}</div>;
	}
	if (success) {
		return <div role='status' className='bg-green-600 bg-opacity-20 text-sm text-green-400 py-2 px-4 rounded-lg border border-green-600'>{success}</div>;
	}
	return null;
}
