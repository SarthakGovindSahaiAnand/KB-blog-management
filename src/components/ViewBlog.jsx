import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from './Header';
// import JoditEditor from 'jodit-react'; // Removed as not needed for viewing
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { useParams, useNavigate } from "react-router-dom"; // Import useParams and useNavigate

export default function ViewBlog() {
    const [currentBlog, setCurrentBlog] = useState({});
    const [posterUser, setPosterUser] = useState(null); // New state for the poster's user object
    const { id } = useParams(); // Get blog ID from URL
    const navigate = useNavigate();
    const config = { readonly: true };
    const { currentUser, getBlogById, deleteBlog, isAdmin } = useAuth(); // Import getBlogById, deleteBlog, and isAdmin
    
    useEffect(() => {
        const fetchBlog = async () => {
            if (!id) return; // Do nothing if no ID is present
            try {
                const blog = await getBlogById(id);
                if (blog) {
                    setCurrentBlog(blog);
                    // Assuming you'll fetch user details if needed from a backend user endpoint
                    // For now, posterUser will be set from blog.author (email)
                    setPosterUser({ email: blog.author }); 
                } else {
                    alert("Blog not found.");
                    navigate("/profile"); // Redirect if blog not found
                }
            } catch (error) {
                console.error("Error fetching blog:", error);
                alert("Failed to load blog.");
                navigate("/profile"); // Redirect on error
            }
        };

        fetchBlog();
    }, [id, getBlogById, navigate]); // Depend on id, getBlogById, and navigate

    const handleDeletePost = async () => {
        const dialog = window.confirm("Are you sure you want to delete this blog post?");
        if (dialog === true) {
            try {
                await deleteBlog(id);
                alert("Blog Deleted Successfully!");
                navigate("/"); // Navigate to home page after deletion
            } catch (error) {
                console.error("Failed to delete blog:", error);
                alert("Failed to delete blog: " + error.message);
            }
        }
    };

    return (
        <Container>
            <Header />
            <BlogContent>
                {currentBlog.title && <h1>{currentBlog.title}</h1>}
                {currentBlog.subHeading && <h2>{currentBlog.subHeading}</h2>}
                {posterUser && <p>By: {posterUser.email}</p>} {/* Display poster's email */}
                {currentBlog.date && <p>Posted on: {new Date(currentBlog.date).toLocaleDateString()}</p>}
                <div dangerouslySetInnerHTML={{ __html: currentBlog.content }} />

                {currentUser && isAdmin && currentBlog.id && (
                    <DeleteButton onClick={handleDeletePost}>Delete Post</DeleteButton>
                )}
            </BlogContent>
        </Container>
    );
}

const Container = styled.div`
    /* Removed flex properties to prevent conflict with Header */
    /* display: flex; */
    /* flex-direction: column; */
    /* min-height: 100vh; */
    /* align-items: center; */
    background-color: #f0f2f5;
`;

const BlogContent = styled.div`
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
    width: 100%;
    max-width: 800px;
    margin: 20px auto; /* Center the blog content */

    h1 {
        color: #333;
        font-size: 2.5em;
        margin-bottom: 10px;
    }

    h2 {
        color: #555;
        font-size: 1.5em;
        margin-bottom: 20px;
    }

    p {
        color: #777;
        font-size: 0.9em;
        margin-bottom: 5px;
    }

    div {
        margin-top: 20px;
        line-height: 1.6;
        color: #444;
    }
`;

const DeleteButton = styled.button`
    background-color: #dc3545; /* Red color for delete */
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 20px;
    align-self: flex-end; /* Align to the right within BlogContent */
    transition: background-color 0.2s ease-in-out;

    &:hover {
        background-color: #c82333;
    }
`;