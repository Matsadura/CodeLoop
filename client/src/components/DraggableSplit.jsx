import TaskMardDown from "./TaskMarkDown"


export default function DraggableSplit(leftSide, rightSide) {
	return <div className="p-4 bg-violet-600 m-4">
		<div className="grid grid-cols-12 rounded-md border border-white overflow-hidden">
			{/* <div className="col-span-12 mb-36">
				<TaskMardDown />
			</div> */}
			<div className="md:col-span-5 col-span-12">
				<TaskMardDown />
			</div>
			<div className="md:col-span-7 col-span-12 border-l border-l-white"></div>
		</div >
	</div>
}
