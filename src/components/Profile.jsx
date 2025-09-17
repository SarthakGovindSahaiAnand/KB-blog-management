import React, {useState, useRef, useEffect} from 'react'
import Header from './Header'
import styled from 'styled-components'
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { useAuth } from '../contexts/AuthContext'
import SearchIcon from '@mui/icons-material/Search';

export default function Profile() {
    const [blogs, setBlogs] = useState([])
    const navigate = useNavigate();
    const searchRef = useRef()
    const [filter, setFilter] = useState("")
    
    const { currentUser, deleteBlog, listBlogsByAuthor } = useAuth()
    
    useEffect(() => {
        if (!currentUser) return
        const fetchUserBlogs = async () => {
            try {
                const allBlogs = await listBlogsByAuthor(currentUser.email);
                setBlogs(allBlogs);
            } catch (error) {
                console.error("Error fetching user blogs:", error);
                setBlogs([]);
            }
        };
        fetchUserBlogs();
    }, [currentUser, listBlogsByAuthor])

    const handleChange = () => {
        setFilter(searchRef.current.value.toLowerCase())
        handleSearch()
    }

    const handleSearch = () => {
        console.log(searchRef.current.value)
        setFilter(searchRef.current.value.toLowerCase())
    }

    const handleDelete = async (blogId) => {
        const dialog = window.confirm("Are you sure you want to delete this blog post?");
        if (dialog) {
            try {
                await deleteBlog(blogId);
                setBlogs(prevBlogs => prevBlogs.filter(b => b.id !== blogId));
                alert("Blog Deleted Successfully!");
            } catch (error) {
                console.error("Failed to delete blog:", error);
                alert("Failed to delete blog: " + error.message);
            }
        }
    };

    const filteredBlogs = blogs.filter(blog => 
        blog.title.toLowerCase().includes(filter) || 
        (blog.subHeading && blog.subHeading.toLowerCase().includes(filter))
    );

    return (
        <ParentContainer>
            <Header/>
            
            <Container>
                {filteredBlogs.length > 0 ? (
                    <Articles>
                        <ArticleSearchbar>  
                            <Bar >
                                <form onSubmit={e => { e.preventDefault(); handleSearch(); }}>
                                    <SearchIcon type="submit"/>
                                    <input 
                                        type="text" 
                                        ref={searchRef} 
                                        onChange={handleChange} 
                                        placeholder="Search your blogs..."
                                    /> 
                                </form>
                            </Bar> 
                        </ArticleSearchbar>
                        
                        {filteredBlogs.slice(0).reverse().map((blog, key) => (
                            <ArticleCard key={key}>
                                <ArticleTextDetails>                        
                                    <ArticleTitle onClick={() => navigate(`/blog/${blog.id}`)}>
                                        {blog.title}
                                    </ArticleTitle>
                                                
                                    <ArticleSubTitle>
                                        {blog.subHeading}
                                    </ArticleSubTitle>

                                    <ArticleFooter>
                                        <ArticleDatePosted>
                                            <p>{blog.date}</p>
                                        </ArticleDatePosted>
                                    </ArticleFooter>
                                </ArticleTextDetails>
                                <Buttons>
                                    <p className="edit" onClick={() => navigate(`/edit-blog/${blog.id}`)}>
                                        Edit
                                    </p>
                                    <p className="delete" onClick={() => handleDelete(blog.id)}>
                                        Delete
                                    </p>
                                </Buttons>
                            </ArticleCard>
                        ))}
                    </Articles>
                ) : (
                    <NoBlogsMessage>You haven't posted any blogs yet.</NoBlogsMessage>
                )}
            </Container>
        </ParentContainer>
    )
}

const ParentContainer = styled.div`
    min-height: 100vh;
    background-color: var(--color-background-page);
`;

const Container = styled.div`
    padding: 20px 50px;
    display: flex;
    justify-content: center;
    max-width: 1200px;
    margin: 0 auto;
`;

const Articles = styled.div`
    width: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    overflow-y: auto;
    max-height: calc(100vh - 120px);

    ::-webkit-scrollbar {
        display: none;
    }
`;

const ArticleSearchbar=styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
`;

const Bar = styled.div`
    display: flex;
    align-items: center;
    border: 1px solid var(--color-border);
    width: 70%;
    padding: 8px 15px;
    border-radius: 20px;
    color: var(--color-text-light);
    background-color: var(--color-background-card);
    box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;

    form {
        display: flex;
        align-items: center;
        width: 100%;
    }

    input {
        border: none;
        margin-left: 10px;
        outline: none;
        width: 100%;
        font-size: 1rem;
        color: var(--color-text-dark);
        background-color: transparent;

        :hover {
            cursor: text;
        }
        ::placeholder {
            color: #a0a0a0;
        }
    }
`;

const ArticleCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 80px;
    border-radius: 12px;
    background-color: var(--color-background-card);
    border: 1px solid #e5e7eb;
    box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 12px;
    padding: 15px 20px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

    &:hover {
        transform: translateY(-3px);
        box-shadow: rgba(0, 0, 0, 0.1) 0px 8px 20px;
    }
`;

const ArticleTextDetails = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

const ArticleTitle = styled.div`
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    
    &:hover {
        text-decoration: underline;
    }
`;
const ArticleSubTitle = styled.div`
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const ArticleFooter = styled.div`
    display: flex;
    font-size: 0.7em;
    color: #9ca3af;
    margin-top: 8px;
`;

const ArticleDatePosted = styled.div`
    p {
        margin: 0;
    }
`;

const Buttons = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    p {
        padding: 8px 12px;
        font-size: 0.85rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        border: 1px solid;
    }

    .edit {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
        
        &:hover {
            background-color: #2563eb;
        }
    }

    .delete {
        background-color: #ef4444;
        color: white;
        border-color: #ef4444;
        
        &:hover {
            background-color: #dc2626;
        }
    }
`;

const NoBlogsMessage = styled.p`
    text-align: center;
    color: #6b7280;
    margin-top: 50px;
    font-size: 1.1rem;
`;