import { useState, useEffect } from 'react';
import InputWithLabel from '../components/InputWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import { request } from '../tools/requestModule';
import SelectWithLabel from "../components/SelectWithLable";
import { useNavigate } from 'react-router-dom';

export default function CreateCatalog({ setNav }) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [imageUrl, setImageUrll] = useState('');
	const [difficulty, setDifficulty] = useState('');
	const navigate = useNavigate();

	// errors
	const [errTitle, setErrTitle] = useState('');
	const [errDescription, setErrDescription] = useState('');
	const [errImageUrl, setErrImageUrl] = useState('');
	const [errDifficulty, setErrDifficulty] = useState('');
	const [errForm, setErrForm] = useState('');

	useEffect(() => setNav(), []);

	function handleCreate(e) {
		e.preventDefault();

		if (wrongInput()) return;
		const requestBody = {
			title: title,
			imageUrl: imageUrl,
			difficulty: difficulty,
			description: description
		};

		let requestHeader = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
		};
		request("/categories", requestHeader)
			.then((res) => {
				if (res.status !== 201) setErrForm(res.data.error ? 'Internal server error' : res.data.error);
				else navigate(`/catalogs/${res.data.id}/tasks`);
			}).catch((e) => {
				setErrForm('error creating new user');
				console.error("Error when creating new catalog", e)
			});
	}

	function wrongInput() {
		let errFound = false;

		if (!title.length) {
			errFound = true;
			setErrTitle('Add a valid title');
		} else setErrTitle('');
		if (!description.length) {
			errFound = true;
			setErrDescription('Add a valid description');
		} else setErrDescription('');
		if (!imageUrl.length) {
			errFound = true;
			setErrImageUrl('Add a valid image URL');
		} else setErrImageUrl('');
		if (!difficulty.length) {
			errFound = true;
			setErrDifficulty('Select a difficulty level');

		} else setErrDifficulty('');
		return errFound
	}

	return <div>
		<form className='flex gap-8 grid grid-cols-12'>
			<div className='col-span-6 flex flex-col gap-6'>
				<InputWithLabel label='Catalog Title' type='text' identifier='catalog_title' value={title} setValue={setTitle} error={errTitle} />
				<InputWithLabel label='Catalog description' type='text' identifier='catalog_desc' value={description} setValue={setDescription} error={errDescription} />
				<div className='border border-blue-400/30 p-4'>
					<InputWithLabel label='Image URL' type='url' identifier='img_url' value={imageUrl} setValue={setImageUrll} error={errImageUrl} />
					<div className='col-span-4 mt-4 flex justify-end'>
						{imageUrl ? <img className='border border-crimson-200 w-40 rounded-md' src={imageUrl} /> :
							<div className='border border-crimson-200 w-40 rounded-md bg-crimson-100/10 h-[60px] text-gray-400 grid items-center justify-center'><span>add image URL</span></div>}
					</div>
				</div>
				<SelectWithLabel identefier='catalog_difficulty' label='Catalog difficulty' value={difficulty} setValue={setDifficulty} error={errDifficulty}>
					<option value=''>Select difficulty</option>
					<option value='easy'>Easy</option>
					<option value='medium'>Medium</option>
					<option value='hard'>Hard</option>
				</SelectWithLabel>
				{errForm.length ? <div className='bg-red-600 bg-opacity-20 text-sm text-red-600 py-2 px-4 rounded-lg'>{errForm}</div> : null}
				<PrimaryBtn label='Create' action={handleCreate} />
			</div>
		</form>
	</div>
}
