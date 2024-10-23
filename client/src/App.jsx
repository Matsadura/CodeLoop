import LogIn from './scenes/LogIn';
import Register from './scenes/Register';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from './components/NavBar';
import { useState, useEffect } from 'react';
import NotFound from './components/NotFound';

function Test({setTitle}) {
  useEffect(() => setTitle('This is a test!'), []);

  return <h1 className="text-5xl text-gray-50">Testing is everything!</h1>
}

function RoutesWithNav() {
  const [title, setTitle] = useState('');

  return <NavBar title={title}>
    <Routes>
      <Route path="/test" element={<Test setTitle={setTitle} />} />
      <Route path="/catalog " element={<Test setTitle={setTitle} />} />
      <Route path="/*" element={<NotFound setTitle={setTitle} />} />
    </Routes>
  </NavBar>
}

function App() {
 

  return (
        <Router>
          <Routes>
            <Route path="/login" element={<LogIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<RoutesWithNav />} />
          </Routes>
        </Router>
  )
}

export default App
