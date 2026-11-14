import { BrowserRouter as Router, matchPath, Route, Routes, useLocation } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute.jsx';
import { ContextProvider } from './components/Context.jsx';
import CreateNewTask from './scenes/CreateNewTask.jsx';
import CatalogCards from './components/CatalogCard';
import NotFound from './components/NotFound';
import DevSpace from './scenes/DevSpace';
import Register from './scenes/Register';
import NavBar from './components/NavBar';
import Profile from './scenes/Profile';
import Tasks from './scenes/Tasks';
import LogIn from './scenes/LogIn';
import { useMemo } from 'react';
import Home from './scenes/Home.jsx';
import CreateCatalog from './scenes/CreateCatalog.jsx';
import UpdateCreatedTask from './scenes/UpdateCreatedTask.jsx';
import Dashboard from './scenes/Dashboard.jsx';


const navigation = [
  { id: 2, name: 'Tasks', title: 'Index of tasks', href: '/tasks' },
  { id: 4, name: 'Catalog', title: 'Here is our catalogs', href: '/catalogs' },
  { id: 5, name: 'Create task', title: 'Create new task', href: '/task/create' },
  { id: 6, name: 'Create catalog', title: 'Create new catalog', href: '/catalog/create' },
];

// Page title and highlighted navigation item, derived from the URL.
const pages = [
  { path: '/', title: '' },
  { path: '/tasks', nav: 2 },
  { path: '/catalogs', nav: 4 },
  { path: '/catalogs/:id_catalog/tasks', nav: 4 },
  { path: '/task/create', nav: 5 },
  { path: '/catalog/create', nav: 6 },
  { path: '/task/:taskId/update', title: 'Update your task' },
  { path: '/profile', title: 'Your profile' },
  { path: '/dashboard', title: 'Dashboard' },
];

function currentPage(pathname) {
  const page = pages.find(({ path }) => matchPath(path, pathname));
  if (!page) return { navId: null, title: 'Not found' };
  const item = navigation.find((i) => i.id === page.nav);
  return { navId: page.nav ?? null, title: item ? item.title : page.title };
}

function RoutesWithNav() {
  const { pathname } = useLocation();
  const { navId, title } = currentPage(pathname);
  const nav = useMemo(
    () => navigation.map((item) => ({ ...item, current: item.id === navId })),
    [navId],
  );

  const page = (element) => <PrivateRoute>{element}</PrivateRoute>;

  return <NavBar title={title} navigation={nav}>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/catalogs' element={page(<CatalogCards />)} />
      <Route path='/tasks' element={page(<Tasks />)} />
      <Route path='/catalogs/:id_catalog/tasks' element={page(<Tasks />)} />
      <Route path='/task/create' element={page(<CreateNewTask />)} />
      <Route path='/task/:taskId/update' element={page(<UpdateCreatedTask />)} />
      <Route path='/catalog/create' element={page(<CreateCatalog />)} />
      <Route path='/profile' element={page(<Profile />)} />
      <Route path='/dashboard' element={page(<Dashboard />)} />
      <Route path='/*' element={<NotFound />} />
    </Routes>
  </NavBar>
}


function App() {
  return (
    <ContextProvider>
      <Router>
        <Routes>
          <Route path='/login' element={<LogIn />} />
          <Route path='/register' element={<Register />} />
          <Route path='/tasks/:taskId' element={<PrivateRoute><DevSpace /></PrivateRoute>} />
          <Route path='*' element={<RoutesWithNav />} />
        </Routes>
      </Router>
    </ContextProvider>
  )
}

export default App;
