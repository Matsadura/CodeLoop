import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';


/**
 * Component for rendering a test case with a title and body
 *
 * @param {string} props.title - The title of the test case
 * @param {string} props.body - The body content of the test case
 * @returns {JSX.Element} The test case component
 */
export default function TestCase({ title, body }) {
	return (
		<div>
			<Disclosure>
				<DisclosureButton className="group flex justify-start text-start items-center gap-2 text-gray-200 my-4">
					<p>{title || 'Test title'}</p>
					<ChevronDownIcon className="w-5 group-data-[open]:rotate-180" />
				</DisclosureButton>
				<DisclosurePanel className="text-gray-400 mb-8 text-[11px] block w-full overflow-auto border py-4 px-2 border-gray-400 border-opacity-20">
					<pre>{body || 'test body'}</pre>
				</DisclosurePanel>
			</Disclosure>
		</div>
	)
}
