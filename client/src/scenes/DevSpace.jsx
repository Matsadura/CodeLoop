import TaskMardDown from '../components/TaskMarkDown';
import Editor from '@monaco-editor/react';
import ResponsiveCodeWithTask from '../components/responsiveCodeWithTask';
import { useEffect } from 'react';


/**
 * Main development space component with split view for code and tasks
 * @param {Object} props
 * @param {Function} props.setTitle - Function to set the page title
 * @returns {React.ReactElement} DevSpace component
 */
export default function DevSpace({ setTitle }) {
    useEffect(() => {
        if (setTitle) setTitle('0x14. MySQL')
    }, [setTitle]);

    return <ResponsiveCodeWithTask
        codeEditor={<Editor defaultLanguage="javascript" theme={'vs-dark'} defaultValue="// some comment" />}
        taskView={< TaskMardDown />}
    />
}
