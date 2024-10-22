import LogIn from './scenes/LogIn';
import Register from './scenes/Register';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from './components/NavBar';

function App() {
  return (
    // <div className='h-full w-full'>
    //   <Register />
    // </div>
    <Router>
      <Routes>
        <Route path="/login" element={<LogIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<NavBar />} />
      </Routes>
    </Router>
  )
}

export default App
