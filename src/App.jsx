import React from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import UpdateProfile from './components/UpdateProfile';
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './components/ForgotPassword';
import CreatePost from './components/CreatePost';
import ViewBlog from './components/ViewBlog';
import Profile from './components/Profile';
import Wait from './components/Wait';
import EditBlog from './components/EditBlog';
import EditUser from './components/EditUser';
import Admin from './components/Admin';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AuthProvider from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

function App() {
  return (
    <Container>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </Container>
  );
}

function AppRoutes() {
  const { currentUser, loading, isAdmin, isSuperAdmin } = useAuth();

  console.log("AppRoutes render: currentUser", currentUser);
  console.log("AppRoutes render: loading", loading);
  console.log("AppRoutes render: isAdmin", isAdmin);
  console.log("AppRoutes render: isSuperAdmin", isSuperAdmin);

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <p>Loading Application...</p>
      </LoadingContainer>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/wait" element={<Wait />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/blog/:id" element={<ViewBlog />} />
      
      {/* Root path conditional rendering */}
      <Route path="/" element={(() => {
        console.log("App.jsx Route /: evaluating conditional rendering...");
        console.log("  isSuperAdmin:", isSuperAdmin);
        console.log("  isAdmin:", isAdmin);
        console.log("  currentUser (for home check):", currentUser ? "present" : "absent");

        if (isSuperAdmin) return <SuperAdminDashboard />;
        if (isAdmin) return <Admin />;
        if (currentUser) return <Home />;
        return <Login />;
      })()} />

      {/* Protected Routes - only accessible if authenticated */}
      <Route element={<PrivateRoute />}>
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/myBlogs" element={<Profile />} />
        <Route path="/edit-blog/:id" element={<EditBlog />} />
        <Route path="/edit-user/:uid" element={<EditUser />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
      </Route>

      {/* Catch-all for Not Found pages */}
      <Route path="*" element={
        <NotFoundContainer>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <button onClick={() => window.history.back()}>Go Back</button>
        </NotFoundContainer>
      } />
    </Routes>
  );
}

export default App;

const Container = styled.div`
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  
  p {
    margin-top: 20px;
    font-size: 18px;
    color: #666;
  }
`;

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  
  h1 {
    color: #dc3545;
    margin-bottom: 20px;
  }
  
  p {
    color: #666;
    margin-bottom: 30px;
    font-size: 16px;
  }
  
  button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    
    &:hover {
      background-color: #0056b3;
    }
  }
`;