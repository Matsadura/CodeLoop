import { useState } from 'react';
import InputWithLabel from '../components/InputWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import FormMessage from '../components/FormMessage';
import { requestJson } from '../tools/requestModule';
import SelectWithLabel from '../components/SelectWithLable';
import { useNavigate } from 'react-router-dom';

const isHttpUrl = (value) => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

export default function CreateCatalog() {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [imageUrl, setImageUrll] = useState('');
	const [difficulty, setDifficulty] = useState('');
	const [errors, setErrors] = useState({});
	const [errForm, setErrForm] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const navigate = useNavigate();


	function validate() {
		const found = {};
		if (!title.trim()) found.title = 'Add a valid title';
		else if (title.length > 128) found.title = 'Use at most 128 characters';
		if (!description.trim()) found.description = 'Add a valid description';
		else if (description.length > 512) found.description = 'Use at most 512 characters';
		if (!isHttpUrl(imageUrl.trim())) found.imageUrl = 'Add a valid http(s) image URL';
		if (!difficulty) found.difficulty = 'Select a difficulty level';
		setErrors(found);
		return Object.keys(found).length === 0;
	}

	async function handleCreate(e) {
		e.preventDefault();
		setErrForm('');
		if (!validate() || submitting) return;
		setSubmitting(true);
		const res = await requestJson('/categories', 'POST', {
			title: title.trim(),
			imageUrl: imageUrl.trim(),
			difficulty,
			description: description.trim(),
		});
		setSubmitting(false);
		if (res.status === 201) navigate(`/catalogs/${res.data.id}/tasks`);
		else {
			if (res.data.field) setErrors({ [res.data.field]: res.data.error });
			setErrForm(res.data.error);
		}
	}

	return <div>
		<form className='grid grid-cols-12 gap-8' onSubmit={handleCreate} noValidate>
			<div className='col-span-12 md:col-span-8 lg:col-span-6 flex flex-col gap-6'>
				<InputWithLabel label='Catalog Title' identifier='catalog_title' value={title} setValue={setTitle} error={errors.title} required maxLength={128} />
				<InputWithLabel label='Catalog description' identifier='catalog_desc' value={description} setValue={setDescription} error={errors.description} required maxLength={512} />
				<div className='border border-blue-400/30 p-4'>
					<InputWithLabel label='Image URL' type='url' identifier='img_url' value={imageUrl} setValue={setImageUrll} error={errors.imageUrl} required />
					<div className='mt-4 flex justify-end'>
						{isHttpUrl(imageUrl) ? <img className='border border-crimson-200 w-40 rounded-md' src={imageUrl} alt='Catalog image preview' /> :
							<div className='border border-crimson-200 w-40 rounded-md bg-crimson-100/10 h-[60px] text-gray-400 grid items-center justify-center'><span>add image URL</span></div>}
					</div>
				</div>
				<SelectWithLabel identifier='catalog_difficulty' label='Catalog difficulty' value={difficulty} setValue={setDifficulty} error={errors.difficulty}>
					<option value=''>Select difficulty</option>
					<option value='Easy'>Easy</option>
					<option value='Medium'>Medium</option>
					<option value='Hard'>Hard</option>
				</SelectWithLabel>
				<FormMessage error={errForm} />
				<PrimaryBtn label={submitting ? 'Creating...' : 'Create'} disabled={submitting} />
			</div>
		</form>
	</div>
}
