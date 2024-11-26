import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import StreamsPage from './components/StreamsPage';
import React from 'react';

const App: React.FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Layout />}>
          <Route index element={<StreamsPage />} />
          <Route path="/streams" element={<StreamsPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </>
    )
  );

  return <RouterProvider router={router} />;
};

export default App;
