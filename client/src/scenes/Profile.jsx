import { useState, useEffect } from 'react';
import InputWithLabel from '../components/InputWithLabel';
import TextEreaWithLabel from '../components/TextEreaWithLabel';
import PrimaryBtn from '../components/PrimaryBtn';
import { request } from '../tools/requestModule';

export default function Profile() {
	const [email, setEmail] = useState('');
	const [fname, setFname] = useState('');
	const [lname, setLname] = useState('');
	const [picUrl, setPicUrl] = useState('');
	const [bio, setBio] = useState('');
	const [showSubmitBtn, setShowSubmitBtn] = useState(false);


	function updateProfile(e) {
		e.preventDefault();

		let requestHeader = {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ first_name: fname, last_name: lname }),
		};
		request("/users", requestHeader)
			.catch((e) => console.error("Error getting user details:", e));

		requestHeader = {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ profile_pic: picUrl, bio: bio }),
		};
		request("/users/profile", requestHeader)
			.then(() => setShowSubmitBtn(false))
			.catch((e) => console.error("Error getting user details:", e));
	}
	// get the user  data from the server and chack
	// if he have a profile in not it will be created
	useEffect(() => {
		let requestHeader = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};
		request("/users", requestHeader).then((res) => {
			setEmail(res.data.email);
			setFname(res.data.first_name);
			setLname(res.data.last_name);
		}).catch((e) => console.error("Error getting user details:", e));

		requestHeader = {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		};
		request("/users/profile", requestHeader).then((res) => {
			if (res.status === 200) {
				setPicUrl(res.data.profile_pic);
				setBio(res.data.bio);
			} else initProfile();
		}).then(() => setShowSubmitBtn(false))
			.catch((e) => console.error("Error updating user profile:", e));
	}, []);

	useEffect(() => setShowSubmitBtn(true),
		[fname, lname, picUrl, bio]);

	function initProfile() {
		const requestHeader = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ profile_pic: import.meta.env.VITE_DEFAULT_AVATAR, bio: 'Hello...' })
		};
		request("/users/profile", requestHeader).then((res) => {
			setPicUrl(res.data.profile_pic);
		}).catch((e) => console.error("Error Creating user profile:", e));
	}

	return <div>
		<form className='flex gap-8 grid grid-cols-12'>
			<div className='col-span-4'>
				<img className='w-full border border-crimson-200' src={picUrl} />
			</div>
			<div className='col-span-6 flex flex-col gap-6'>
				<div className='flex flex-col gap-3'>
					<label className="block text-sm font-medium text-white">Email</label>
					<span className='bg-violet-300 bg-opacity-40 border border-violet-100 text-violet-100 text-sm py-2 px-2 font-voilet-200 rounded-lg cursor-not-allowed'>{email}</span>
				</div>
				<InputWithLabel label='First Name' type='text' identifier='first_name' value={fname} setValue={setFname} />
				<InputWithLabel label='Last Name' type='text' identifier='last_name' value={lname} setValue={setLname} />
				<InputWithLabel label='Avatar URL' type='text' identifier='avatar_url' value={picUrl} setValue={setPicUrl} />
				<TextEreaWithLabel label='Bio' identifier='bio' value={bio} setValue={setBio} />
				{showSubmitBtn ? <PrimaryBtn label='update' action={updateProfile} /> : null}
			</div>
		</form>
	</div>
}
