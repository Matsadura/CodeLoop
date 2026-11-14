import { useState, useEffect, useContext } from 'react';
import InputWithLabel from '../components/InputWithLabel';
import TextEreaWithLabel from '../components/TextEreaWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import FormMessage from '../components/FormMessage';
import PageStatus from '../components/PageStatus';
import { DataContext } from '../components/dataContext';
import { requestJson } from '../tools/requestModule';
import { DEFAULT_AVATAR, getOrCreateProfile } from '../tools/avatar';

export default function Profile() {
	const { setUser } = useContext(DataContext);
	const [email, setEmail] = useState('');
	const [fname, setFname] = useState('');
	const [lname, setLname] = useState('');
	const [picUrl, setPicUrl] = useState('');
	const [bio, setBio] = useState('');
	const [dirty, setDirty] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [formError, setFormError] = useState('');
	const [success, setSuccess] = useState('');
	const [saving, setSaving] = useState(false);


	// Load the account and the profile, creating a default profile if needed.
	useEffect(() => {
		let active = true;
		async function load() {
			const userRes = await requestJson('/users');
			const profileRes = await getOrCreateProfile(requestJson);
			if (!active) return;
			if (!userRes.ok) setLoadError(userRes.data.error);
			else if (!profileRes.ok) setLoadError(profileRes.data.error);
			else {
				setEmail(userRes.data.email);
				setFname(userRes.data.first_name);
				setLname(userRes.data.last_name);
				setPicUrl(profileRes.data.profile_pic || '');
				setBio(profileRes.data.bio || '');
			}
			setLoading(false);
		}
		load();
		return () => { active = false; };
	}, []);

	const edit = (setter) => (value) => {
		setter(value);
		setDirty(true);
		setSuccess('');
	};

	async function updateProfile(e) {
		e.preventDefault();
		setFormError('');
		if (!fname.trim() || !lname.trim()) {
			setFormError('First and last name are required.');
			return;
		}
		setSaving(true);
		const userRes = await requestJson('/users', 'PUT', { first_name: fname.trim(), last_name: lname.trim() });
		const profileRes = userRes.ok
			? await requestJson('/users/profile', 'PUT', { profile_pic: picUrl.trim(), bio })
			: userRes;
		setSaving(false);
		if (!profileRes.ok) {
			setFormError(profileRes.data.error);
			return;
		}
		setUser(userRes.data);
		setDirty(false);
		setSuccess('Profile updated!');
	}

	if (loading) return <PageStatus loading message='Loading your profile...' />;
	if (loadError) return <PageStatus error={loadError} />;

	return <div>
		<form className='grid grid-cols-12 gap-8' onSubmit={updateProfile} noValidate>
			<div className='col-span-12 md:col-span-4'>
				<img className='w-full max-w-xs border border-crimson-200' src={picUrl || DEFAULT_AVATAR} alt='Your avatar' />
			</div>
			<div className='col-span-12 md:col-span-8 lg:col-span-6 flex flex-col gap-6'>
				<div className='flex flex-col gap-3'>
					<span className='block text-sm font-medium text-white'>Email</span>
					<span className='bg-violet-300 bg-opacity-40 border border-violet-100 text-violet-100 text-sm py-2 px-2 rounded-lg cursor-not-allowed break-all'>{email}</span>
				</div>
				<InputWithLabel label='First Name' identifier='first_name' autoComplete='given-name' value={fname} setValue={edit(setFname)} required maxLength={128} />
				<InputWithLabel label='Last Name' identifier='last_name' autoComplete='family-name' value={lname} setValue={edit(setLname)} required maxLength={128} />
				<InputWithLabel label='Avatar URL' type='url' identifier='avatar_url' value={picUrl} setValue={edit(setPicUrl)} />
				<TextEreaWithLabel label='Bio' identifier='bio' value={bio} setValue={edit(setBio)} />
				<FormMessage error={formError} success={success} />
				{dirty ? <PrimaryBtn label={saving ? 'Saving...' : 'Update'} disabled={saving} /> : null}
			</div>
		</form>
	</div>
}
