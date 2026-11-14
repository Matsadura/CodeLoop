import { TbRotateClockwise } from 'react-icons/tb';

/**
 * Shared loading / empty / error state block.
 */
export default function PageStatus({ loading = false, error = '', message = '', onRetry, children }) {
	if (loading) {
		return <div role='status' aria-live='polite' className='flex items-center justify-center gap-2 py-12 text-gray-300'>
			<TbRotateClockwise className='animate-spin text-xl' aria-hidden='true' />
			<span>{message || 'Loading...'}</span>
		</div>;
	}
	if (error) {
		return <div role='alert' className='flex flex-col items-center gap-3 py-12 text-center'>
			<p className='text-red-400'>{error}</p>
			{onRetry ? <button type='button' className='rounded-md border border-crimson-200 px-3 py-1 text-sm text-crimson-200 hover:bg-crimson-200 hover:text-white' onClick={onRetry}>Try again</button> : null}
		</div>;
	}
	return <div className='py-12 text-center text-gray-300'>{message}{children}</div>;
}
