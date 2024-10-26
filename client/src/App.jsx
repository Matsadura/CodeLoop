import LogIn from './scenes/LogIn';
import Register from './scenes/Register';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import { useState, useEffect } from 'react';
import NotFound from './components/NotFound';
import Example from './components/CatalogCard';
import Tasks from './scenes/Tasks';
import DevSpace from './scenes/DevSpace';
import { Dragger } from './components/responsiveCodeWithTask';

function Test({ setTitle }) {
  useEffect(() => setTitle('This is a test!'), [setTitle]);

  return <h1 className="text-5xl text-gray-50">Testing is everything!</h1>
}

function RoutesWithNav() {
  const [title, setTitle] = useState('');

  return <NavBar title={title}>
    <Routes>
      <Route path="/test" element={<Test setTitle={setTitle} />} />
      <Route path="/catalogs" element={<Example setTitle={setTitle} />} />
      <Route path="/catalogs/:id/tasks" element={<Tasks setTitle={setTitle} />} />
      <Route path="/*" element={<NotFound setTitle={setTitle} />} />
      <Route path="/splitfull" element={<DevSpace setTitle={setTitle} />} />
    </Routes>
  </NavBar>
}

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/split" element={<DevSpace />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<RoutesWithNav />} />
      </Routes>
    </Router>
  )
}

export default App
