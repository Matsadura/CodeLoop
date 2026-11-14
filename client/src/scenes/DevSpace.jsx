import ResponsiveCodeWithTask from '../components/responsiveCodeWithTask';
import CodeEditorLoader from '../components/CodeEditorWaiting';
import Editor, { useMonaco } from '@monaco-editor/react';
import TaskMardDown from '../components/TaskMarkDown';
import { requestJson } from '../tools/requestModule';
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';


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
};

const EDITOR_OPTIONS = {
  automaticLayout: true,
  minimap: { enabled: false },
  lineNumbers: 'off',
  folding: false,
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  guides: { indentation: false },
  renderValidationDecorations: 'off',
  scrollBeyondLastLine: false,
  smoothScrolling: false,
  suggestOnTriggerCharacters: false,
  quickSuggestions: false,
  wordBasedSuggestions: 'off',
  parameterHints: { enabled: false },
  tabCompletion: 'off',
  stickyScroll: { enabled: false },
};

const DEFAULT_SNIPPET = 'def solution(inputs):\n    # Your solution code\n    pass\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n# do _not_ change this function\nimport sys\ndef execute_code(input):\n    data = eval(input)\n    return solution(data)\nif __name__ == "__main__":\n    input_data = sys.stdin.read()\n    result = execute_code(input_data)\n    print(result)\n';

// While Judge0 is still running a submission the API answers 202; poll the
// submission until it is graded (bounded so the page never polls forever).
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


/**
 * Main development space component with split view for code and tasks
 * @returns {React.ReactElement} DevSpace component
 */
export default function DevSpace() {
  const monaco = useMonaco();
  const [snippet, setSnippet] = useState('');
  const [editorMouting, setEditorMounting] = useState(true);
  const [latest, setLatest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showTests, setShowTests] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);
  const mounted = useRef(true);
  const { taskId } = useParams();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

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
    requestJson(`/tasks/${taskId}/submissions`).then((res) => {
      if (!mounted.current) return;
      if (res.ok && Array.isArray(res.data) && res.data.length) {
        const sorted = [...res.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSnippet(sorted[0].code);
        setLatest(sorted[0]);
      } else {
        setSnippet(DEFAULT_SNIPPET);
      }
    });
  }, [taskId]);

  async function waitForResult(submission) {
    let current = submission;
    for (let i = 0; i < MAX_POLLS && current.status === 'pending'; i++) {
      await sleep(POLL_INTERVAL_MS);
      if (!mounted.current) return current;
      const res = await requestJson(`/submissions/${current.id}`);
      if (!res.ok) break;
      current = res.data;
      setLatest(current);
    }
    return current;
  }

  async function submitCode() {
    if (submitting) return;
    if (!snippet.trim()) {
      setSubmitError('Write some code before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const res = await requestJson(`/tasks/${taskId}/submit`, 'POST', { code: snippet, language: 'python' });
    let submission = null;
    if (res.status === 201) {
      submission = res.data;
    } else if (res.status === 202) {
      setLatest(res.data);
      submission = await waitForResult(res.data);
    } else if (res.data.submission) {
      submission = res.data.submission;
      setSubmitError(res.data.error);
    } else {
      setSubmitError(res.data.error);
    }
    if (!mounted.current) return;
    if (submission) {
      setLatest(submission);
      if (submission.status === 'correct' || submission.status === 'incorrect') {
        setResultsKey((k) => k + 1);
        setShowTests(true);
      } else if (submission.status === 'pending') {
        setSubmitError('Your code is still running. Check the results again in a moment.');
      }
    }
    setSubmitting(false);
  }

  return <ResponsiveCodeWithTask
    onSubmit={submitCode}
    submitting={submitting}
    submitError={submitError}
    latest={latest}
    showTests={showTests}
    setShowTests={setShowTests}
    resultsKey={resultsKey}
    codeEditor={
      <div className='bg-transparent h-full'>
        {editorMouting ? <CodeEditorLoader /> : null}
        <Editor
          value={snippet}
          onChange={(code) => setSnippet(code ?? '')}
          language='python'
          theme={'photon'}
          options={EDITOR_OPTIONS}
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
