import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import Header from './Header'; // Ensure Header is imported
import BasicEditor from './BasicEditor'; // Import BasicEditor

function EditBlog() {
    const { id } = useParams();
    console.log("EditBlog component render: id from useParams", id);
    const headingRef = useRef(); // Ref for title input
    const subHeadingRef = useRef(); // Ref for subHeading input
    const [blogContent, setBlogContent] = useState(''); // State for BasicEditor content
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { currentUser, getBlogById, editBlog } = useAuth();

    useEffect(() => {
        console.log("EditBlog useEffect triggered. id in useEffect:", id);
        const fetchBlog = async () => {
            try {
                const blog = await getBlogById(id);
                if (blog) {
                    console.log("Blog fetched successfully in EditBlog:", blog);
                    headingRef.current.value = blog.title;
                    subHeadingRef.current.value = blog.subHeading;
                    setBlogContent(blog.content);
                } else {
                    alert("Blog not found.");
                    navigate("/profile");
                }
            } catch (error) {
                console.error("Error fetching blog:", error);
                alert("Failed to load blog for editing.");
                navigate("/profile");
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [id, getBlogById, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await editBlog(id, headingRef.current.value, subHeadingRef.current.value, blogContent);
            alert("Blog post updated successfully!");
            navigate("/profile");
        } catch (error) {
            console.error("Failed to update blog post:", error);
            alert("Failed to update blog post.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Header />
            <Form onSubmit={handleSubmit}>
                <h2>Edit Blog Post</h2>
                <Input
                    type="text"
                    placeholder="Title"
                    ref={headingRef}
                    required
                />
                <Input
                    type="text"
                    placeholder="Sub Heading"
                    ref={subHeadingRef}
                />
                <BasicEditor
                    initialContent={blogContent}
                    onContentChange={setBlogContent}
                />
                <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Post"}
                </Button>
            </Form>
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    align-items: center;
    background-color: #f0f2f5;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    background-color: white;
    margin-top: 20px;
    width: 100%;
    max-width: 800px;

    h2 {
        color: #333;
        margin-bottom: 10px;
        text-align: center;
    }
`;

const Input = styled.input`
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
`;

const Button = styled.button`
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: #0056b3;
    }

    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

export default EditBlog;