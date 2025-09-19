import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
`;

const Sidebar = styled.div`
  width: 280px;
  background-color: #ffffff;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`;

const MainContent = styled.div`
  flex: 1;
  background-color: #ffffff;
  border: none;
  display: flex;
  flex-direction: column;
  padding: 30px;
`;

const Header = styled.div`
  background-color: #007bff;
  color: white;
  padding: 20px 0;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SidebarItem = styled.div`
  padding: 15px 25px;
  border-bottom: 1px solid #eeeeee;
  cursor: pointer;
  font-size: 16px;
  color: #333333;
  transition: background-color 0.2s ease, color 0.2s ease;
  background-color: ${props => props.active ? '#e9ecef' : 'transparent'};
  
  &:hover {
    background-color: #f8f9fa;
    color: #0056b3;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
`;

const ContentTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #343a40;
  margin: 0;
`;

const AdminSection = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AdminLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #555555;
`;

const ManageAccessLabel = styled.div`
  font-size: 14px;
  color: #777777;
`;

const DropdownContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  margin-top: 15px;
`;

const Select = styled.select`
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 15px;
  background-color: white;
  min-width: 180px;
  color: #495057;
  
  &:focus {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    outline: none;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  background-color: white;
  max-height: 150px;
  overflow-y: auto;
  min-width: 180px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
`;

const CheckboxInput = styled.input`
  cursor: pointer;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  background-color: white;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    border-color: #80bdff;
  }
  
  &:focus {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    outline: none;
  }
`;

const DropdownArrow = styled.span`
  margin-left: 8px;
  transition: transform 0.2s ease;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ced4da;
  border-top: none;
  border-radius: 0 0 5px 5px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DropdownWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownItem = styled.label`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const DropdownCheckbox = styled.input`
  margin-right: 8px;
  cursor: pointer;
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  border: none;
  background-color: #28a745;
  color: white;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #218838;
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #ced4da;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: #f1f1f1;
  }
`;

const ItemCard = styled.div`
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 18px 25px;
  background-color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ItemTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #343a40;
`;

const ItemDescription = styled.div`
  font-size: 13px;
  color: #6c757d;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px 15px;
  border: 1px solid #007bff;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  border-radius: 5px;
  transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
  
  &:hover {
    background-color: #0056b3;
    border-color: #0056b3;
  }
  
  &.delete {
    background-color: #dc3545;
    border-color: #dc3545;
    
    &:hover {
      background-color: #c82333;
      border-color: #bd2130;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 15px;
`;

const SuccessMessage = styled.div`
  background-color: #d4edda;
  color: #155724;
  padding: 15px;
  border: 1px solid #c3e6cb;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 15px;
`;

const CategoryForm = styled.form`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f8f9fa;
`;

const CategoryInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 15px;
`;

const CategoryButton = styled.button`
  padding: 8px 15px;
  border: none;
  background-color: #28a745;
  color: white;
  font-size: 15px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #218838;
  }
  
  &.delete {
    background-color: #dc3545;
    &:hover {
      background-color: #c82333;
    }
  }
`;


const SuperAdminDashboard = () => {
  const { 
    currentUser, 
    listBlogs, 
    listUsers, 
    deleteBlog, 
    changeUserRole, 
    toggleUserStatus, 
    logout, 
    deleteUser,
    toggleManageAllBlogsAccess,
    listAdmins,
    getBlogSpecificAccess,
    grantBlogSpecificAccess,
    revokeBlogSpecificAccess,
    listBlogCategories,
    createBlogCategory,
    deleteBlogCategory,
  } = useAuth();
  
  const [activeSection, setActiveSection] = useState('users');
  const [blogs, setBlogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedAccess, setSelectedAccess] = useState('');
  const [selectedBlogAccess, setSelectedBlogAccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [blogAccessMap, setBlogAccessMap] = useState({});
  const [openDropdowns, setOpenDropdowns] = useState({});
  const dropdownRefs = useRef({});
  const [categories, setCategories] = useState([]);
  const newCategoryRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        const [allBlogs, allUsers, allAdmins, allCategories] = await Promise.all([
          listBlogs(),
          listUsers(),
          listAdmins(),
          listBlogCategories(),
        ]);
        
        setBlogs(allBlogs);
        setUsers(allUsers);
        setAdmins(allAdmins);
        setCategories(allCategories);
      } catch (err) {
        console.error("SuperAdmin Dashboard: Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'superadmin') {
      fetchData();
    } else if (currentUser) {
      setError("Access denied. SuperAdmin privileges required.");
      setLoading(false);
    }
  }, [currentUser, listBlogs, listUsers, listAdmins, listBlogCategories]);

  useEffect(() => {
    const fetchBlogAccess = async () => {
      const newBlogAccessMap = {};
      for (const blog of blogs) {
        try {
          const accessRecords = await getBlogSpecificAccess(blog.id);
          newBlogAccessMap[blog.id] = accessRecords.map(record => record.user_uid);
        } catch (err) {
          console.error(`Error fetching access for blog ${blog.id}:`, err);
        }
      }
      setBlogAccessMap(newBlogAccessMap);
    };

    if (activeSection === 'access' && blogs.length > 0 && admins.length > 0) {
      fetchBlogAccess();
    }
  }, [activeSection, blogs, admins, getBlogSpecificAccess]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(openDropdowns).forEach(blogId => {
        if (openDropdowns[blogId] && dropdownRefs.current[blogId] && !dropdownRefs.current[blogId].contains(event.target)) {
          setOpenDropdowns(prev => ({ ...prev, [blogId]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdowns]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    try {
      clearMessages();
      
      if (selectedRole) {
        await changeUserRole(selectedUser, selectedRole);
        setUsers(users.map(user => 
          user.uid === selectedUser ? { ...user, role: selectedRole } : user
        ));
      }

      if (selectedAccess) {
        const isDisabled = selectedAccess === 'disabled';
        await toggleUserStatus(selectedUser, isDisabled);
        setUsers(users.map(user => 
          user.uid === selectedUser ? { ...user, isDisabled: isDisabled ? 1 : 0 } : user
        ));
      }

      setSuccess("User updated successfully!");
      setSelectedUser('');
      setSelectedRole('');
      setSelectedAccess('');
    } catch (err) {
      console.error("Error updating user:", err);
      setError(`Failed to update user: ${err.message}`);
    }
  };

  const handleToggleBlogAccess = async (userUid, currentAccess) => {
    try {
      clearMessages();
      const newAccess = currentAccess === 1 ? 0 : 1;
      await toggleManageAllBlogsAccess(userUid, newAccess === 1);
      setUsers(users.map(user => 
        user.uid === userUid ? { ...user, canManageAllBlogs: newAccess } : user
      ));
      setSuccess(`Blog management access ${newAccess === 1 ? 'granted' : 'revoked'} successfully.`);
    } catch (err) {
      console.error("Error toggling blog management access:", err);
      setError(`Failed to toggle blog management access: ${err.message}`);
    }
  };

  const handleBlogSpecificAccessChange = async (blogId, selectedAdminUids) => {
    try {
      clearMessages();
      const currentAdminUids = blogAccessMap[blogId] || [];

      const adminsToGrant = selectedAdminUids.filter(uid => !currentAdminUids.includes(uid));
      for (const uid of adminsToGrant) {
        await grantBlogSpecificAccess(uid, blogId);
      }

      const adminsToRevoke = currentAdminUids.filter(uid => !selectedAdminUids.includes(uid));
      for (const uid of adminsToRevoke) {
        await revokeBlogSpecificAccess(uid, blogId);
      }

      setBlogAccessMap(prev => ({ ...prev, [blogId]: selectedAdminUids }));
      setSuccess("Blog specific access updated successfully!");
    } catch (err) {
      console.error("Error updating blog specific access:", err);
      setError(`Failed to update blog specific access: ${err.message}`);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        clearMessages();
        await deleteBlog(blogId);
        setBlogs(blogs.filter(blog => blog.id !== blogId));
        setSuccess("Blog deleted successfully!");
      } catch (err) {
        console.error("Error deleting blog:", err);
        setError(`Failed to delete blog: ${err.message}`);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        clearMessages();
        await deleteUser(userId);
        setUsers(users.filter(user => user.uid !== userId));
        setSuccess("User deleted successfully!");
      } catch (err) {
        console.error("Error deleting user:", err);
        setError(`Failed to delete user: ${err.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to logout");
    }
  };

  const toggleDropdown = (blogId) => {
    setOpenDropdowns(prev => ({ ...prev, [blogId]: !prev[blogId] }));
  };

  const handleDropdownCheckboxChange = async (blogId, adminUid, isChecked) => {
    
    const currentAdmins = blogAccessMap[blogId] || [];
    const newAdminList = isChecked
      ? [...currentAdmins, adminUid]
      : currentAdmins.filter(uid => uid !== adminUid);
    
    try {
      clearMessages();
      if (isChecked) {
        await grantBlogSpecificAccess(adminUid, blogId);
      } else {
        await revokeBlogSpecificAccess(adminUid, blogId);
      }
      setBlogAccessMap(prev => ({ ...prev, [blogId]: newAdminList }));
      setSuccess("Blog specific access updated successfully!");
    } catch (err) {
      console.error("Error updating blog specific access:", err);
      setError(`Failed to update blog specific access: ${err.message}`);
    }
  };
  
  const getDropdownButtonText = (blogId) => {
    const selectedAdmins = blogAccessMap[blogId] || [];
    if (selectedAdmins.length === 0) {
      return "Select Admins";
    } else if (selectedAdmins.length === 1) {
      const admin = admins.find(a => a.uid === selectedAdmins[0]);
      return admin ? admin.email : "1 admin selected";
    } else {
      return `${selectedAdmins.length} admins selected`;
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const newCategoryName = newCategoryRef.current.value.trim();
    if (!newCategoryName) {
      setError("Category name cannot be empty.");
      return;
    }
    try {
      clearMessages();
      await createBlogCategory(newCategoryName);
      const updatedCategories = await listBlogCategories();
      setCategories(updatedCategories);
      setSuccess(`Category "${newCategoryName}" created successfully!`);
      newCategoryRef.current.value = "";
    } catch (err) {
      console.error("Error creating category:", err);
      setError(`Failed to create category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This cannot be undone.`)) {
      try {
        clearMessages();
        await deleteBlogCategory(categoryId);
        const updatedCategories = await listBlogCategories();
        setCategories(updatedCategories);
        setSuccess(`Category "${categoryName}" deleted successfully!`);
      } catch (err) {
        console.error("Error deleting category:", err);
        setError(`Failed to delete category: ${err.message}`);
      }
    }
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center', fontSize: '18px', color: '#555'}}>Loading SuperAdmin Dashboard...</div>;
  
  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div style={{padding: '50px', textAlign: 'center', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', margin: '50px'}}>
        <h1>Access Denied</h1>
        <p style={{marginBottom: '20px'}}>You need SuperAdmin privileges to access this page.</p>
        <button 
          onClick={() => navigate("/login")}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <DashboardContainer>
      <Sidebar>
        <Header>Super Admin Console</Header>
        <SidebarItem 
          active={activeSection === 'users' ? 'true' : 'false'} 
          onClick={() => setActiveSection('users')}
        >
          Manage Users
        </SidebarItem>
        <SidebarItem 
          active={activeSection === 'blogs' ? 'true' : 'false'} 
          onClick={() => setActiveSection('blogs')}
        >
          Manage Blogs
        </SidebarItem>
        <SidebarItem 
          active={activeSection === 'access' ? 'true' : 'false'} 
          onClick={() => setActiveSection('access')}
        >
          Blog Access Control
        </SidebarItem>
        <SidebarItem 
          active={activeSection === 'categories' ? 'true' : 'false'} 
          onClick={() => setActiveSection('categories')}
        >
          Manage Categories
        </SidebarItem>
        <SidebarItem onClick={handleLogout}>
          Logout
        </SidebarItem>
      </Sidebar>

      <MainContent>
        <ContentArea>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          {activeSection === 'users' && (
            <>
              <ContentHeader>
                <ContentTitle>User Management</ContentTitle>
                <AdminSection>
                  <DropdownContainer>
                    <Select 
                      value={selectedUser} 
                      onChange={(e) => {
                        setSelectedUser(e.target.value);
                        const user = users.find(u => u.uid === e.target.value);
                        if (user) {
                          setSelectedRole(user.role);
                          setSelectedAccess(user.isDisabled ? 'disabled' : 'active');
                        } else {
                          setSelectedRole('');
                          setSelectedAccess('');
                        }
                      }}
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.uid} value={user.uid}>
                          {user.email} ({user.role})
                        </option>
                      ))}
                    </Select>
                    <Select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={!selectedUser}
                    >
                      <option value="">Change Role</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </Select>
                    <Select 
                      value={selectedAccess} 
                      onChange={(e) => setSelectedAccess(e.target.value)}
                      disabled={!selectedUser}
                    >
                      <option value="">Change Access</option>
                      <option value="active">Enable</option>
                      <option value="disabled">Disable</option>
                    </Select>
                    <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                  </DropdownContainer>
                </AdminSection>
              </ContentHeader>

              <ItemList>
                {users.map(user => (
                  <ItemCard key={user.uid}>
                    <ItemInfo>
                      <ItemTitle>{user.email}</ItemTitle>
                      <ItemDescription>
                        Role: {user.role} | Status: {user.isDisabled ? 'Disabled' : 'Active'} | UID: {user.uid}
                      </ItemDescription>
                    </ItemInfo>
                    <ItemActions>
                      <ActionButton onClick={() => {
                        setSelectedUser(user.uid);
                        setSelectedRole(user.role);
                        setSelectedAccess(user.isDisabled ? 'disabled' : 'active');
                      }}>
                        Edit
                      </ActionButton>
                      <ActionButton 
                        className="delete"
                        onClick={() => handleDeleteUser(user.uid)}
                      >
                        Delete
                      </ActionButton>
                    </ItemActions>
                  </ItemCard>
                ))}
              </ItemList>
            </>
          )}

          {activeSection === 'blogs' && (
            <>
              <ContentHeader>
                <ContentTitle>Blog Management</ContentTitle>
                <AdminSection>
                  <ActionButton onClick={() => navigate("/create-post")}>
                    Create New Blog
                  </ActionButton>
                </AdminSection>
              </ContentHeader>

              <ItemList>
                {blogs.map(blog => (
                  <ItemCard key={blog.id}>
                    <ItemInfo>
                      <ItemTitle>{blog.title}</ItemTitle>
                      <ItemDescription>
                        By: {blog.author} | Date: {new Date(blog.date).toLocaleDateString()}
                      </ItemDescription>
                    </ItemInfo>
                    <ItemActions>
                      <ActionButton onClick={() => navigate(`/blog/${blog.id}`)}>
                        View
                      </ActionButton>
                      <ActionButton onClick={() => navigate(`/edit-blog/${blog.id}`)}>
                        Edit
                      </ActionButton>
                      <ActionButton 
                        className="delete"
                        onClick={() => handleDeleteBlog(blog.id)}
                      >
                        Delete
                      </ActionButton>
                    </ItemActions>
                  </ItemCard>
                ))}
              </ItemList>
            </>
          )}

          {activeSection === 'access' && (
            <>
              <ContentHeader>
                <ContentTitle>Blog Access Management</ContentTitle>
              </ContentHeader>

              <ItemList>
                {blogs.map(blog => (
                  <ItemCard key={blog.id}>
                    <ItemInfo>
                      <ItemTitle>{blog.title}</ItemTitle>
                      <ItemDescription>
                        By: {blog.author} | Date: {new Date(blog.date).toLocaleDateString()}
                      </ItemDescription>
                    </ItemInfo>
                    <ItemActions>
                      <DropdownWrapper ref={el => dropdownRefs.current[blog.id] = el}>
                        <DropdownButton
                          onClick={() => toggleDropdown(blog.id)}
                          type="button"
                        >
                          {getDropdownButtonText(blog.id)}
                          <DropdownArrow isOpen={openDropdowns[blog.id]}>▼</DropdownArrow>
                        </DropdownButton>
                        {openDropdowns[blog.id] && (
                          <DropdownMenu onClick={(e) => e.stopPropagation()}>
                            {admins.map(admin => {
                              const isChecked = (blogAccessMap[blog.id] || []).includes(admin.uid);
                              return (
                                <DropdownItem key={admin.uid}>
                                  <DropdownCheckbox
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      handleDropdownCheckboxChange(blog.id, admin.uid, e.target.checked);
                                    }}
                                  />
                                  {admin.email}
                                </DropdownItem>
                              );
                            })}
                          </DropdownMenu>
                        )}
                      </DropdownWrapper>
                    </ItemActions>
                  </ItemCard>
                ))}
              </ItemList>
            </>
          )}
          
          {activeSection === 'categories' && (
            <>
              <ContentHeader>
                <ContentTitle>Manage Categories</ContentTitle>
              </ContentHeader>
              <CategoryForm onSubmit={handleCreateCategory}>
                <CategoryInput 
                  type="text" 
                  ref={newCategoryRef} 
                  placeholder="New Category Name" 
                  required 
                />
                <CategoryButton type="submit">Create Category</CategoryButton>
              </CategoryForm>
              <ItemList>
                {categories.length > 0 ? (
                  categories.map(category => (
                    <ItemCard key={category.id}>
                      <ItemInfo>
                        <ItemTitle>{category.name}</ItemTitle>
                      </ItemInfo>
                      <ItemActions>
                        <CategoryButton className="delete" onClick={() => handleDeleteCategory(category.id, category.name)}>
                          Delete
                        </CategoryButton>
                      </ItemActions>
                    </ItemCard>
                  ))
                ) : (
                  <p>No categories found.</p>
                )}
              </ItemList>
            </>
          )}
        </ContentArea>
      </MainContent>
    </DashboardContainer>
  );
};

export default SuperAdminDashboard;