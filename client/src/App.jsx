import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute.jsx';
import { ContextProvider } from "./components/Context.jsx";
import CreateNewTask from './scenes/CreateNewTask.jsx';
import CatalogCards from './components/CatalogCard';
import NotFound from './components/NotFound';
import DevSpace from './scenes/DevSpace';
import Register from './scenes/Register';
import NavBar from './components/NavBar';
import Profile from './scenes/Profile';
import Tasks from './scenes/Tasks';
import LogIn from './scenes/LogIn';
import { useState } from 'react';
import Home from './scenes/Home.jsx';
import CreateCatalog from './scenes/CreateCatalog.jsx';
import UpdateCreatedTask from './scenes/UpdateCreatedTask.jsx';


const navigation = [
  // { id: 1, name: 'Home', title: 'Home', href: '/', current: false },
  { id: 2, name: 'Tasks', title: 'Index of tasks', href: '/tasks', current: false },
  { id: 4, name: 'Catalog', title: 'Here is our catalogs', href: '/catalogs', current: false },
  { id: 5, name: 'Create task', title: 'Create new task', href: '/task/create', current: false },
  { id: 6, name: 'Create catalog', title: 'Create new catalog', href: '/catalog/create', current: false },
  { id: 7, name: 'Update task', title: 'Update created task', href: '/task/143203f8-21bb-4b4d-abb8-5e268e0e512c/update', current: false },
]

function RoutesWithNav() {
  const [title, setTitle] = useState('');
  const [nav, setNav] = useState(navigation);

  // Just call this function in the compenent to set
  // the title of the page and also the  current navigation item
  function setCurrPage(id) {
    const newNav = [...nav];
    for (let i = 0; i < navigation.length; i++) {
      const item = navigation[i];
      if (item.id === id) {
        item.current = true;
        setTitle(item.title);
      } else item.current = false;
    }
    setNav(newNav);
  }


  return <NavBar title={title} navigation={nav}>
    <PrivateRoute open={true}>
      <Routes>
        <Route
          path='/'
          element={<Home setNav={() => setCurrPage(-1)} />}
        />
        <Route
          path='/catalogs'
          element={<CatalogCards setNav={() => setCurrPage(4)} />}
        />
        <Route
          path='/tasks'
          element={<Tasks setNav={() => setCurrPage(2)} />}
        />
        <Route path='/catalogs/:id_catalog/tasks' element={<Tasks setNav={() => setCurrPage(2)} />} />
        <Route
          path="/task/create"
          element={
            <PrivateRoute>
              <CreateNewTask setNav={() => setCurrPage(5)} />
            </PrivateRoute>
          }
        />
        <Route
          path="/task/:taskId/update"
          element={
            <PrivateRoute>
              <UpdateCreatedTask setNav={() => setCurrPage(7)} />
            </PrivateRoute>
          }
        />
        <Route
          path="/catalog/create"
          element={
            <PrivateRoute>
              <CreateCatalog setNav={() => setCurrPage(6)} />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile setNav={() => setCurrPage(-1)} />
            </PrivateRoute>
          }
        />
        <Route path="/*" element={<NotFound setNav={() => setCurrPage(-1)} />} />
      </Routes>
    </PrivateRoute>
  </NavBar>
}



function App() {
  return (
    <ContextProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PrivateRoute open={true}><LogIn /></PrivateRoute>} />
          <Route path="/register" element={<PrivateRoute open={true}><Register /></PrivateRoute>} />
          <Route
            path="/tasks/:taskId"
            element={
              <PrivateRoute>
                <DevSpace />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<RoutesWithNav />} />
        </Routes>
      </Router>
    </ContextProvider>
  )
}

export default App;
