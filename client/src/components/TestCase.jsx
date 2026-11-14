import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import CodeOutput from './CodeOutput';

const STATUS_CLASS = {
  fail: 'text-red-500',
  pass: 'text-green-500',
};

/**
 * Component for rendering the result of one test case
 *
 * @param {Object} props.test - A solution result returned by the API
 * @returns {JSX.Element} The test case component
 */
export default function TestCase({ test }) {
  const testStatus = STATUS_CLASS[test.status] || 'text-blue-500';

  return (
    <div className='p-1'>
      <Disclosure>
        <DisclosureButton className={`group flex justify-start text-start items-center gap-2 ${testStatus} my-2`}>
          <span className='text-gray-400 text-[12px]'>Case <span className='sr-only'>({test.status})</span></span><pre className='whitespace-pre-wrap break-all'>{test.stdin}</pre>
          <ChevronDownIcon className='w-5 group-data-[open]:rotate-180' aria-hidden='true' />
        </DisclosureButton>
        <DisclosurePanel className='text-gray-400 mb-8 text-[11px] block w-full overflow-auto border py-4 px-2 border-gray-400 border-opacity-20'>
          <p className='text-red-200 mb-2'>Got</p>
          <CodeOutput output={test.stdout} codeState={test.status} />
          <p className='text-red-200 mb-2 mt-6'>Expected Output</p>
          <CodeOutput output={test.expected_output} codeState={test.status} />
          {test.stderr ? <div className='mt-2'>
            <p className='text-red-200 mb-4'>Stderr</p>
            <CodeOutput output={test.stderr} codeState={test.status} />
          </div> : null}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}
