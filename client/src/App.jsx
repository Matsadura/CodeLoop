import LogIn from './scenes/LogIn';
import Register from './scenes/Register';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import { useState } from 'react';
import NotFound from './components/NotFound';
import CatalogCards from './components/CatalogCard';
import Tasks from './scenes/Tasks';
import DevSpace from './scenes/DevSpace';


function RoutesWithNav() {
  const [title, setTitle] = useState('');

  return <NavBar title={title}>
    <Routes>
      <Route path="/catalogs" element={<CatalogCards setTitle={setTitle} />} />
      <Route path="/catalogs/:id/tasks" element={<Tasks setTitle={setTitle} />} />
      <Route path="/catalogs/:id/tasks/:id" element={<DevSpace setTitle={setTitle} />} />
      <Route path="/*" element={<NotFound setTitle={setTitle} />} />
    </Routes>
  </NavBar>
}

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/split" element={<DevSpace />} /> */}
        <Route path="/login" element={<LogIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<RoutesWithNav />} />
      </Routes>
    </Router>
  )
}

export default App;
