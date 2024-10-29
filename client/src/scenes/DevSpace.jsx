import ResponsiveCodeWithTask from '../components/responsiveCodeWithTask';
import CodeEditorLoader from '../components/CodeEditorWaiting';
import Editor, { useMonaco } from '@monaco-editor/react';
import TaskMardDown from '../components/TaskMarkDown';
import { request } from '../tools/requestModule';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';


const Photon = {
  'editorGroup.dropBackground': '#44475A',
  'editorGroupHeader.tabsBackground': '#171520',
  'editor.foreground': '#F8F8F2',
  'editor.background': '#161624',
  'editor.lineHighlightBorder': '#d9d1da22',
  'editorIndentGuide.activeBackground': '#FFFFFF45',
  'editorSuggestWidget.background': '#21222C',
  'editorSuggestWidget.foreground': '#F8F8F2',
  'editorLineNumber.foreground': '#404851',
  'editorCursor.foreground': '#ff00d3',
  'editor.selectionBackground': '#44475ab3',
  'editor.selectionHighlightBackground': '#424450',
  'editorSuggestWidget.selectedBackground': '#2f2f47',
}


/**
 * Main development space component with split view for code and tasks
 * @param {Object} props
 * @param {Function} props.setTitle - Function to set the page title
 * @returns {React.ReactElement} DevSpace component
 */
export default function DevSpace({ setTitle }) {
  const monaco = useMonaco();
  const [snippet, setSnippet] = useState('import sys\n\ndef solution(input):\n    # Your solution code TESTING\n    data = eval(input)\n    output = 0\n    for i in data:\n        output += i\n    return output\n\n\nif __name__ == \"__main__\":\n    input_data = sys.stdin.read()\n    result = solution(input_data)\n    print(result)\n');
  const [editorMouting, setEditorMounting] = useState(true);
  const [lastSubbmitId, setLastSubmitId] = useState('');
  const { taskId } = useParams();

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('photon', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: Photon,
      });
      monaco.editor.setTheme('photon');
    }
  }, [monaco]);

  useEffect(() => {
    if (setTitle) setTitle('Duck is you friend :)');
  }, []);

  useEffect(() => {
    getLastSubmission();
  }, []);

  function getLastSubmission() {
    const request_header = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    request(`/tasks/${taskId}/submissions`, request_header).then((res) => {
      if (res.data.length === 0)
        setSnippet('def solution():\n\t# Your code goes here...');
      else {
        res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSnippet(res.data[0].code);
        setLastSubmitId(res.data[0].id);
      }
    });
  }

  function SubmitCode() {
    const request_header = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: snippet,
        language: "python"
      })
    };
    console.log(request_header)
    request(`/tasks/${taskId}/submit`, request_header).then((res) => {
      console.log(res);
    });
  }


  return <ResponsiveCodeWithTask
    // submitAction={SubmitCode}
    snippet={snippet}
    codeEditor={
      <div className="bg-transparent h-full">
        {editorMouting ? <CodeEditorLoader /> : null}
        <Editor
          value={snippet}
          onChange={(code) => setSnippet(code)}
          language='python'
          theme={'photon'}
          automaticLayout={false}
          minimap={{ enabled: false }}
          lineNumbers='off'
          folding={false}
          renderLineHighlight='none'
          overviewRulerLanes={0}
          hideCursorInOverviewRuler={true}
          renderIndentGuides={false}
          renderLineHighlightOnlyWhenFocus={false}
          renderValidationDecorations='off'
          scrollBeyondLastLine={false}
          smoothScrolling={false}
          suggestOnTriggerCharacters={false}
          quickSuggestions={false}
          wordBasedSuggestions={false}
          parameterHints={false}
          tabCompletion='off'
          stickyScroll={{
            enabled: false
          }}
          onMount={() => {
            setEditorMounting(false);
          }}
          loading={null}
        />
      </div>
    }
    taskView={<TaskMardDown taskId={taskId} />}
  />
}
