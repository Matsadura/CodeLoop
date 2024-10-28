import TaskMardDown from '../components/TaskMarkDown';
import Editor, { useMonaco } from '@monaco-editor/react';
import ResponsiveCodeWithTask from '../components/responsiveCodeWithTask';
import { useEffect, useState } from 'react';
import CodeEditorLoader from '../components/CodeEditorWaiting';


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
export default function DevSpace({ setNav }) {
  const monaco = useMonaco();
  const [snippet, setSnippet] = useState('#include <stdio.h>\n\nint main(void)\n{\n\tprintf("Hello there :)");\n}\n');
  const [editorMouting, setEditorMounting] = useState(true);


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
    if (setNav) setNav();
  }, []);

  function logSnippet(code) {
    setSnippet(code)
    console.log(snippet);
  }

  return <ResponsiveCodeWithTask
    codeEditor={
      <div className="bg-transparent h-full">
        {editorMouting ? <CodeEditorLoader /> : null}
        <Editor
          value={snippet}
          onChange={(code) => logSnippet(code)}
          language='c'
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
    taskView={<TaskMardDown />}
  />
}
