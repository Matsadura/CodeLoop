import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute.jsx';
import { ContextProvider } from "./components/Context.jsx";
import CatalogCards from './components/CatalogCard';
import NotFound from './components/NotFound';
import CreateNewTask from './scenes/CreateNewTask.jsx';
import DevSpace from './scenes/DevSpace';
import Register from './scenes/Register';
import NavBar from './components/NavBar';
import Tasks from './scenes/Tasks';
import LogIn from './scenes/LogIn';
import { useState } from 'react';



const navigation = [
  { id: 1, name: 'Home', title: 'Home', href: '/', current: false },
  { id: 2, name: 'Tasks', title: 'Index of tasks', href: '/tasks', current: false },
  // { id: 3, name: 'Dev-Space', title: 'Where the magic happens', href: '/catalogs/1/tasks/1', current: false },
  { id: 4, name: 'Catalog', title: 'Here is our catalogs', href: '/catalogs', current: false },
  { id: 5, name: 'Create task', title: 'Create new task', href: '/task/create', current: false },
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
    console.log(nav);
  }


  return <NavBar title={title} navigation={nav}>
    <PrivateRoute open={true}>
      <Routes>
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
          path="/tasks/:taskId"
          element={
            <PrivateRoute>
              <DevSpace setTitle={setTitle} />
            </PrivateRoute>
          }
        />
        <Route
          path="/task/create"
          element={
            <PrivateRoute>
              <CreateNewTask setNav={() => setCurrPage(5)} />
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
          {/* <Route path="/split" element={<DevSpace />} /> */}
          <Route path="/login" element={<LogIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<RoutesWithNav />} />
        </Routes>
      </Router>
    </ContextProvider>
  )
}

export default App;
