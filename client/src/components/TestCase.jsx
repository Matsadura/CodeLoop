import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import CodeOutput from './CodeOutput';
import { useEffect, useState } from 'react';


/**
 * Component for rendering a test case with a title and body
 *
 * @param {string} props.title - The title of the test case
 * @param {string} props.body - The body content of the test case
 * @returns {JSX.Element} The test case component
 */
export default function TestCase({ title, test }) {
  const [testStatus, setTestStatus] = useState('');

  useEffect(() => {
    if (test.status === 'fail') {
      setTestStatus('text-red-500');
    } else if (test.status === 'pass') {
      setTestStatus('text-green-500');
    } else {
      setTestStatus('text-blue-500');
    }
  }, []);


  return (
    <div>
      <Disclosure>
        <DisclosureButton className={`group flex justify-start text-start items-center gap-2 ${testStatus} my-4`}>
          <pre>{test.stdin}</pre>
          <ChevronDownIcon className="w-5 group-data-[open]:rotate-180" />
        </DisclosureButton>
        <DisclosurePanel className="text-gray-400 mb-8 text-[11px] block w-full overflow-auto border py-4 px-2 border-gray-400 border-opacity-20">
          <CodeOutput output={test.stdout} codeState={test.status} />
          {test.stderr ? <CodeOutput output={test.stderr} codeState={test.status} /> : null}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}
