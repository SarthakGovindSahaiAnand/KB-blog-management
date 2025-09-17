import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from "react-router-dom";

import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext'

function Article() {

    const [blogs, setBlogs] = useState([])
    const [filter, setFilter] = useState("")
    const [sortOption, setSortOption] = useState('newest');
    const navigate = useNavigate();
    const searchRef = useRef()
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const { currentUser, listBlogs } = useAuth()
    
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const all = await listBlogs();
                setBlogs(all);
            } catch (error) {
                console.error("Error fetching blogs:", error);
                setBlogs([]);
            }
        };
        fetchBlogs();
    }, [listBlogs])

    const handleFilterChange = () => {
        setFilter(searchRef.current.value.toLowerCase())
    }

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setFilter(searchRef.current.value.toLowerCase());
    }

    const handleSort = (option) => {
        setSortOption(option);
        setShowSortDropdown(false);
    }
    
    const sortAndFilterBlogs = (blogsToSort) => {
        if (!blogsToSort || blogsToSort.length === 0) return [];
        
        const filtered = blogsToSort.filter(blog => 
            blog.title.toLowerCase().includes(filter)
        );

        const sorted = [...filtered].sort((a, b) => {
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

    const sortedAndFilteredBlogs = sortAndFilterBlogs(blogs);

    return (
        <ParentContainer>
            <Container>
                <HeaderContainer>
                    <ArticleSearchbar>
                        <Bar>
                            <form onSubmit={handleSearch}>
                                <SearchIcon type="submit"/>
                                <input type="text" ref={searchRef} onChange={handleFilterChange} placeholder="Search Article by Title..."/> 
                            </form>
                        </Bar> 
                    </ArticleSearchbar>
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
                </HeaderContainer>

                <Articles>
                    {sortedAndFilteredBlogs && sortedAndFilteredBlogs.length > 0 ? (
                        sortedAndFilteredBlogs.map((blog, key) => (
                            <ArticleCard key={key} onClick={() => navigate(`/blog/${blog.id}`)}>
                                <ArticleTitle>
                                    {blog.title}
                                </ArticleTitle>
                                <ArticleDatePosted>
                                    <p>{new Date(blog.date).toLocaleDateString()}</p>
                                </ArticleDatePosted>
                            </ArticleCard>
                        ))
                    ) : (
                        <p>No blogs found.</p>
                    )}
                </Articles>
            </Container>
        </ParentContainer>
    );
}

export default Article

const ParentContainer = styled.div`
    min-height: 100vh;
    background-color: var(--color-background-page);
`;

const Container = styled.div`
    font-family: 'Inter', sans-serif;
    padding: 20px 50px;
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 10px;
`;

const Articles = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px; /* Reduced gap between cards */
    overflow-y: auto;
    max-height: calc(100vh - 150px);
    
    ::-webkit-scrollbar {
        display: none;
    }
`;

const ArticleSearchbar = styled.div`
    flex: 1;
    min-width: 250px;
    
    form {
        display: flex;
        align-items: center;
        width: 100%;
    }
`;

const Bar = styled.div`
    display: flex;
    align-items: center;
    border: 1px solid var(--color-border);
    padding: 8px 15px;
    border-radius: 20px;
    color: var(--color-text-light);
    background-color: var(--color-background-card);
    box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;

    input {
        border: none;
        margin-left: 10px;
        outline: none;
        width: 100%;
        font-size: 1rem;
        color: var(--color-text-dark);
        background-color: transparent;

        ::placeholder {
            color: #a0a0a0;
        }
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
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        background-color: #f0f2f5;
        border-color: #a0a0a0;
    }
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
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

const ArticleCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 45px;
    border-radius: 6px;
    background-color: var(--color-background-card);
    border: 1px solid var(--color-border);
    box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 3px 0px;
    padding: 10px 15px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    font-family: 'Roboto', sans-serif;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 8px;
        background-color: #f8f9fa;
    }
`;

const ArticleTitle = styled.div`
    font-weight: 500;
    font-size: 1rem;
    line-height: 1.3;
    color: var(--color-text-dark);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex-grow: 1;
    
    &:hover {
        text-decoration: underline;
    }
`;

const ArticleDatePosted = styled.div`
    font-size: 0.8rem;
    color: var(--color-text-medium);
    white-space: nowrap;
    margin-left: 20px;
    flex-shrink: 0;
    
    p {
        margin: 0;
    }
`;

const ArticleSubTitle = styled.div` display: none; `;
const ArticleFooter = styled.div` display: none; `;
const ArticleClassTag = styled.div` display: none; `;
const ArticleSubjectTag = styled.div` display: none; `;
const ArticleTopicTag = styled.div` display: none; `;
const RightSideBar = styled.div` display: none; `;
const Advert = styled.div` display: none; `;
const ArticleTextDetails = styled.div` display: none; `;