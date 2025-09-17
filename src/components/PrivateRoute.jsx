import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute() {
    const { currentUser, loading } = useAuth()

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Remove explicit role-based redirection here
    // The redirection to specific dashboards will be handled in App.jsx
    
    return <Outlet />;
}
