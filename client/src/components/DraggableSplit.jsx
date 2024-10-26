import TaskMardDown from "./TaskMarkDown";
import Editor from '@monaco-editor/react';


export default function DraggableSplit(leftSide, rightSide) {
	return <div className="p-4 bg-violet-600 m-4">
		<div className="grid grid-cols-12 rounded-md border border-white overflow-hidden">
			{/* <div className="col-span-12 mb-36">
				<TaskMardDown />
			</div> */}
			<div className="md:col-span-5 col-span-12">
				<TaskMardDown />
			</div>
			<div className="md:col-span-7 col-span-12 border-l border-l-white">
				<Editor height="90vh" defaultLanguage="javascript" defaultValue="// some comment" />;
			</div>
		</div>
	</div>
}
