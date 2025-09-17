import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from "react-router-dom";
// import SearchIcon from '@mui/icons-material/Search'; // Not used, consider removing if no search functionality
import { useAuth } from '../contexts/AuthContext'
// import database from '. // Only used for docx, can be removed if not needed
import Header from './Header'; // Re-add Header import
import BasicEditor from './BasicEditor'; // Import BasicEditor
// import mammothModule from 'mammoth'; // Re-add mammoth import

const UnauthorizedMessage = styled.div`
    text-align: center;
    font-size: 24px;
    color: var(--color-secondary);
    margin-top: 50px;
`;

function CreatePost() {

    const headingRef = useRef();
    const subHeadingRef = useRef();
    const [blogContent, setBlogContent] = useState(''); // State to hold the content from BasicEditor
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null); // Ref for docx file input
    const navigate = useNavigate();
    const { currentUser, createBlog, isAdmin } = useAuth(); // isAdmin is now from AuthContext

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            setError("You are not authorized to create a post.");
            return;
        }

        try {
            setError("");
            setLoading(true);
            await createBlog(headingRef.current.value, subHeadingRef.current.value, blogContent);
            alert("Blog Created Successfully!");
            navigate('/admin'); // Redirect to admin page after creating post
        } catch (err) {
            setError("Failed to create blog: " + err.message);
            console.error(err) 
        } finally {
            setLoading(false);
        }
    };

    const handleDocxUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setLoading(true);
            setError("");
            try {
                const mammothModule = await import('mammoth'); // Dynamic import of the whole module
                const arrayBuffer = await file.arrayBuffer();
                const { value } = await mammothModule.convertToHtml({ arrayBuffer });
                console.log("Mammoth converted HTML value:", value);
                setBlogContent(value); // Set the extracted HTML to the editor content
            } catch (err) {
                console.error("Docx conversion error:", err);
                setError("Failed to convert docx file.");
            } finally {
                setLoading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""; // Clear the file input
                }
            }
        }
    };

    if (!isAdmin) {
        return (
            <ParentContainer>
                <Header/>
                <UnauthorizedMessage>
                    You are not authorized to create a post.
                </UnauthorizedMessage>
            </ParentContainer>
        );
    }

    return (
        <ParentContainer>
            <Header/>
            <Container>
                <Heading>Write New Blog</Heading>
                {error && <Alert>{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Title</Label>
                        <Input type="text" ref={headingRef} required />
                    </FormGroup>
                    <FormGroup>
                        <Label>Sub Heading</Label>
                        <Input type="text" ref={subHeadingRef} required />
                    </FormGroup>
                    <FormGroup>
                        <Label>Content</Label>
                        <BasicEditor initialContent={blogContent} onContentChange={setBlogContent} />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="docx-upload">Upload .docx file (for KB content)</Label>
                        <input
                            type="file"
                            id="docx-upload"
                            accept=".docx"
                            ref={fileInputRef}
                            onChange={handleDocxUpload}
                            style={{ display: 'none' }} // Hide the default input
                        />
                        <Button type="button" onClick={() => fileInputRef.current.click()} disabled={loading}>
                            Browse .docx
                        </Button>
                    </FormGroup>
                    <Button disabled={loading} type="submit">Create Post</Button>
                </Form>
            </Container>
        </ParentContainer>
    )
}

export default CreatePost

const ParentContainer = styled.div`
    min-height: 100vh;
    background-color: var(--color-background-page);
`

const Container = styled.div`
    max-width: 800px;
    margin: 30px auto;
    padding: 30px;
    background-color: var(--color-background-card);
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
`

const Heading = styled.h2`
    font-size: 2rem;
    color: var(--color-text-dark);
    margin-bottom: 25px;
    text-align: center;
`

const Alert = styled.div`
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    padding: 10px 15px;
    border-radius: 6px;
    margin-bottom: 20px;
    text-align: center;
`

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
`

const Label = styled.label`
    font-size: 1rem;
    color: var(--color-text-medium);
    margin-bottom: 8px;
    font-weight: 500;
`

const Input = styled.input`
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 1rem;
    color: var(--color-text-dark);
    background-color: var(--color-background-page);
`

const Button = styled.button`
    background-color: var(--color-primary);
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: var(--color-primary);
        filter: brightness(0.9);
    }

    &:disabled {
        background-color: var(--color-text-light);
        cursor: not-allowed;
    }
`