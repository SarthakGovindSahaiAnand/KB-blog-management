import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import Header from './Header'
import { useNavigate, Link } from 'react-router-dom'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { useAuth } from '../contexts/AuthContext'
import SearchIcon from '@mui/icons-material/Search';

function Admin() {
    const [blogs, setBlogs] = useState([])
    const [users, setUsers] = useState([])
    const [isAdminState, setIsAdminState] = useState([])
    const [blogAccessStatus, setBlogAccessStatus] = useState({});
    
    const [filter, setFilter] = useState("")
    const [filteruser, setUserFilter] = useState("")
    const [sortOption, setSortOption] = useState('newest');

    const searchRef = useRef()
    const searchUserRef = useRef()
    const navigate = useNavigate();
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const { currentUser, isAdmin: isAuthAdmin, listBlogs, listUsers, deleteBlog, listBlogsByAuthor } = useAuth();
    const { checkBlogSpecificAccess } = useAuth();
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch ALL blogs so admins can see all articles
                const allBlogs = await listBlogs(); 
                setBlogs(allBlogs);

                const accessStatus = {};
                // The conditional rendering for buttons below will handle access control
                if (currentUser && currentUser.role === "admin") {
                    for (const blog of allBlogs) {
                        const hasAccess = await checkBlogSpecificAccess(currentUser.uid, blog.id);
                        accessStatus[blog.id] = hasAccess;
                    }
                }
                setBlogAccessStatus(accessStatus);

                const allUsers = await listUsers();
                const enabledAndNonSuperAdmins = allUsers.filter(user => user.isDisabled === 0 && user.role !== 'superadmin');
                setUsers(enabledAndNonSuperAdmins);
                setIsAdminState(enabledAndNonSuperAdmins.filter(user => user.role === 'admin'));
            } catch (error) {
                console.error("Error fetching admin data:", error);
                setBlogs([]);
                setUsers([]);
                setIsAdminState([]);
            }
        };

        fetchData();
    }, [isAuthAdmin, currentUser, listBlogs, listUsers, listBlogsByAuthor, checkBlogSpecificAccess]);

    const handleChange = () => {
        setFilter(searchRef.current.value.toLowerCase())
    }

    const handleUserChange = () => {
        setUserFilter(searchUserRef.current.value.toLowerCase())
    }

    const handleSort = (option) => {
        setSortOption(option);
        setShowSortDropdown(false);
    }
    
    const sortBlogs = (blogsToSort) => {
        if (!blogsToSort || blogsToSort.length === 0) return [];
        
        const sorted = [...blogsToSort].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            if (sortOption === 'newest') {
                return dateB - dateA;
            } else if (sortOption === 'oldest') {
                return dateA - dateB;
            }
            return 0;
        });
        
        return sorted;
    }

    const filteredAndSortedBlogs = sortBlogs(
        blogs.filter(blog => blog.title.toLowerCase().includes(filter))
    );

    return (
        <ParentContainer>
            <Header/>
            <Container>
                <LeftPanel>
                    <SectionTitle>Manage Blogs</SectionTitle>
                    <Controls>
                        <SearchBar>
                            <SearchIcon/>
                            <input
                                type="text"
                                ref={searchRef}
                                onChange={handleChange}
                                placeholder="Search by title..."
                            />
                        </SearchBar>
                        <SortDropdownContainer>
                            <SortButton onClick={() => setShowSortDropdown(!showSortDropdown)}>
                                Sort by Date ▼
                            </SortButton>
                            {showSortDropdown && (
                                <DropdownMenu>
                                    <DropdownItem onClick={() => handleSort('newest')}>Created (newest first)</DropdownItem>
                                    <DropdownItem onClick={() => handleSort('oldest')}>Created (oldest first)</DropdownItem>
                                </DropdownMenu>
                            )}
                        </SortDropdownContainer>
                    </Controls>

                    <Articles>
                        {filteredAndSortedBlogs.length > 0 ? (
                            filteredAndSortedBlogs.map((blog, key) => (
                                <ArticleCard key={key}>
                                    <ArticleDetails>
                                        <ArticleTitle onClick={() => navigate(`/blog/${blog.id}`)}>
                                            {blog.title}
                                        </ArticleTitle>
                                        <ArticleMeta>
                                            <p>By: {blog.author}</p>
                                            <p>Date: {blog.date}</p>
                                        </ArticleMeta>
                                    </ArticleDetails>
                                    {/* Only show buttons if the current user is the author or has access */}
                                    {(currentUser.email === blog.author || currentUser.canManageAllBlogs || blogAccessStatus[blog.id]) && (
                                        <ArticleActions>
                                            <ActionButton className="edit" onClick={() => { navigate(`/edit-blog/${blog.id}`) }}>Edit</ActionButton>
                                            <ActionButton className="delete" onClick={async () => {
                                                const dialog = window.confirm("Are you sure you want to delete this blog post?")
                                                if(dialog === true){
                                                    try {
                                                        await deleteBlog(blog.id);
                                                        setBlogs(prevBlogs => prevBlogs.filter(b => b.id !== blog.id));
                                                        alert("Blog Deleted Successfully!");
                                                    } catch (error) {
                                                        console.error("Failed to delete blog:", error);
                                                        alert("Failed to delete blog: " + error.message);
                                                    }
                                                }
                                            }}>Delete</ActionButton>
                                        </ArticleActions>
                                    )}
                                </ArticleCard>
                            ))
                        ) : (
                            <p>No blogs found.</p>
                        )}
                    </Articles>
                </LeftPanel>

                <RightPanel>
                    <SectionTitle>User Overview</SectionTitle>
                    <Controls>
                        <SearchBar>
                            <SearchIcon/>
                            <input
                                type="text"
                                ref={searchUserRef}
                                onChange={handleUserChange}
                                placeholder="Search user by email..."
                            />
                        </SearchBar>
                    </Controls>
                    <UserList>
                        <UserCard key="header" className="header">
                            <UserEmail>Email</UserEmail>
                            <UserRole>Role</UserRole>
                        </UserCard>
                        {users.filter(user => filteruser ? user.email.toLowerCase().includes(filteruser) : true)
                              .slice(0).reverse().map((user, key) => (
                                <UserCard key={key}>
                                    <UserEmail>{user.email}</UserEmail>
                                    <UserRole>{user.role}</UserRole>
                                </UserCard>
                        ))}
                    </UserList>
                </RightPanel>
            </Container>
        </ParentContainer>
    )
}

export default Admin

const ParentContainer = styled.div`
    min-height: 100vh;
    background-color: var(--color-background-page);
`;

const Container = styled.div`
    display: flex;
    gap: 30px;
    padding: 30px 50px;
    max-width: 1300px;
    margin: 0 auto;
`;

const LeftPanel = styled.div`
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const RightPanel = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const SectionTitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-dark);
    margin-bottom: 0;
`;

const Controls = styled.div`
    display: flex;
    gap: 15px;
    align-items: center;
`;

const SearchBar = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 8px 15px;
    box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;

    input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 1rem;
        padding-left: 10px;
        color: var(--color-text-dark);
        background-color: transparent;
    }
`;

const SortDropdownContainer = styled.div`
    position: relative;
`;

const SortButton = styled.button`
    padding: 10px 15px;
    background-color: #ffffff;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    color: var(--color-text-dark);
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: #f0f2f5;
        border-color: #a0a0a0;
    }
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    background-color: white;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 8px;
    z-index: 10;
    min-width: 220px;
`;

const DropdownItem = styled.div`
    padding: 12px 15px;
    cursor: pointer;
    font-size: 0.95rem;
    color: var(--color-text-dark);
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--color-background-page);
    }
`;

const Articles = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    max-height: calc(100vh - 250px);
    
    &::-webkit-scrollbar {
        width: 8px;
    }
    
    &::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
        border-radius: 4px;
    }
`;

const ArticleCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 15px 20px;
    box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 12px;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
        transform: translateY(-3px);
        box-shadow: rgba(0, 0, 0, 0.1) 0px 8px 20px;
    }
`;

const ArticleDetails = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

const ArticleTitle = styled.div`
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
    cursor: pointer;
    
    &:hover {
        text-decoration: underline;
    }
`;

const ArticleMeta = styled.div`
    display: flex;
    gap: 10px;
    font-size: 0.8rem;
    color: #6b7280;
    
    p {
        margin: 0;
    }
`;

const ArticleActions = styled.div`
    display: flex;
    gap: 10px;
`;

const ActionButton = styled.button`
    padding: 8px 12px;
    font-size: 0.85rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    
    &.edit {
        background-color: #3b82f6;
        color: white;
        border: 1px solid #3b82f6;
        
        &:hover {
            background-color: #2563eb;
        }
    }
    
    &.delete {
        background-color: #ef4444;
        color: white;
        border: 1px solid #ef4444;
        
        &:hover {
            background-color: #dc2626;
        }
    }
`;

const UserList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    max-height: calc(100vh - 250px);
    
    &::-webkit-scrollbar {
        width: 8px;
    }
    
    &::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
        border-radius: 4px;
    }
`;

const UserCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 15px;
    font-size: 0.9rem;
    color: #333;
    box-shadow: rgba(0, 0, 0, 0.03) 0px 1px 2px 0px;
    
    &.header {
        background-color: #f3f4f6;
        font-weight: 600;
        border-bottom: 2px solid var(--color-primary);
        color: var(--color-text-dark);
        border-radius: 8px 8px 0 0;
    }
`;

const UserEmail = styled.div`
    flex: 3;
`;

const UserRole = styled.div`
    flex: 1;
    text-align: right;
    color: #6b7280;
`;