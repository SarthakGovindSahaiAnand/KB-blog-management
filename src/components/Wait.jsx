import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Wait() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // This logic is now handled within AuthContext's login/signup processes
        navigate('/'); // prevent looping back to /wait
    }, [currentUser, navigate]);

    return (
        <Container>
            <p>Redirecting...</p>
        </Container>
    );
}

export default Wait;

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-size: 18px;
    font-weight: bold;
`;