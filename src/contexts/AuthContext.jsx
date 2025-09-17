import React, { createContext, useContext, useState, useEffect } from "react";
import Storage from "../utils/Storage"; // Adjust the path based on your project structure

const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:5001';

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = Storage.get("currentUser", null);
    console.log("AuthContext useEffect: checking Storage for user...");
    if (savedUser) {
      setCurrentUser(savedUser);
      console.log("🔄 AuthContext useEffect: Restored user from Storage:", savedUser);
    } else {
      console.log("AuthContext useEffect: No user found in Storage.");
    }
    setLoading(false);
    console.log("AuthContext useEffect: Loading set to false.");
  }, []);

  const signup = async (email, password, role = "user") => {
    try {
      console.log("📝 Attempting signup:", { email, role });
      const response = await fetch(`${API_BASE_URL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign up');
      }
      
      const newUser = await response.json();
      setCurrentUser(newUser);
      Storage.set("currentUser", newUser);
      console.log("✅ Signup successful:", newUser);
      return newUser;
    } catch (error) {
      console.error("❌ Error signing up:", error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      console.log("🔐 Attempting login:", email);
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Login API Error:", errorData);
        throw new Error(errorData.error || 'Failed to log in');
      }
      
      const user = await response.json();
      console.log("Login API successful, received user:", user);
      setCurrentUser(user);
      Storage.set("currentUser", user);
      console.log("✅ Login successful, currentUser set to:", user);
      return user;
    } catch (error) {
      console.error("❌ Error logging in:", error);
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    Storage.remove("currentUser");
    console.log("👋 User logged out");
  };

  const createBlog = async (title, subHeading, bodyContent) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!["admin", "superadmin"].includes(currentUser.role)) throw new Error("Unauthorized: Only admins and superadmins can create blogs");
    
    const datePosted = new Date().toISOString().split('T')[0];
    const blogId = `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log("✍️ Creating blog:", { title, author: currentUser.email });
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: blogId,
          title, 
          subHeading, 
          content: bodyContent, 
          author: currentUser.email, 
          date: datePosted,
          requesterRole: currentUser.role,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create blog post');
      }
      
      const result = await response.json();
      console.log("✅ Blog created:", result);
      return result;
    } catch (error) {
      console.error("❌ Error creating blog:", error);
      throw error;
    }
  };

  const editBlog = async (id, title, subHeading, bodyContent) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!["admin", "superadmin"].includes(currentUser.role)) throw new Error("Unauthorized: Only admins and superadmins can edit blogs");
    
    try {
      console.log("✏️ Editing blog:", { id, title });
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title, 
          subHeading, 
          content: bodyContent, 
          author: currentUser.email, 
          date: new Date().toISOString().split('T')[0],
          requesterRole: currentUser.role,
          requesterUid: currentUser.uid,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update blog post');
      }
      
      const result = await response.json();
      console.log("✅ Blog edited:", result);
      return result;
    } catch (error) {
      console.error("❌ Error editing blog:", error);
      throw error;
    }
  };

  const deleteBlog = async (id) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!["admin", "superadmin"].includes(currentUser.role)) throw new Error("Unauthorized: Only admins and superadmins can delete blogs");
    
    try {
      console.log("🗑️ Deleting blog:", id);
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterRole: currentUser.role,
          requesterEmail: currentUser.email,
          requesterUid: currentUser.uid,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }
      
      console.log("✅ Blog deleted");
      return true;
    } catch (error) {
      console.error("❌ Error deleting blog:", error);
      throw error;
    }
  };

  const getBlogById = async (id) => {
    if (!id) {
      console.error("❌ getBlogById called with null or undefined ID.");
      return null;
    }
    try {
      console.log("📖 Fetching blog by ID:", id);
      const response = await fetch(`${API_BASE_URL}/posts/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog post');
      }
      
      const blog = await response.json();
      console.log("✅ Blog fetched:", blog.title);
      return blog;
    } catch (error) {
      console.error("❌ Error fetching blog by ID:", error);
      throw error;
    }
  };

  const listBlogs = async () => {
    try {
      console.log("📖 Fetching all blogs");
      const response = await fetch(`${API_BASE_URL}/posts`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      
      const blogs = await response.json();
      console.log("✅ Blogs fetched:", blogs.length);
      return blogs;
    } catch (error) {
      console.error("❌ Error listing blogs:", error);
      throw error;
    }
  };

  const listUsers = async () => {
    if (!currentUser) throw new Error("Not logged in");
    if (!["admin", "superadmin"].includes(currentUser.role)) throw new Error("Unauthorized: Only admins and superadmins can list users");
    
    try {
      console.log("👥 Fetching users list");
      const response = await fetch(`${API_BASE_URL}/users?requesterRole=${currentUser.role}`); 
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const users = await response.json();
      console.log("✅ Users fetched:", users.length);
      return users;
    } catch (error) {
      console.error("❌ Error listing users:", error);
      throw error;
    }
  };

  const getUserByUid = async (uid) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!["superadmin", "admin"].includes(currentUser.role) && currentUser.uid !== uid) {
      throw new Error("Unauthorized: You can only view your own details or are not a superadmin/admin.");
    }
    
    try {
      console.log("👤 Fetching user by UID:", uid);
      const response = await fetch(`${API_BASE_URL}/users/${uid}?requesterRole=${currentUser.role}&requesterUid=${currentUser.uid}`); 
      
      if (!response.ok) {
        throw new Error('Failed to fetch user by UID');
      }
      
      const user = await response.json();
      console.log("✅ User fetched:", user);
      return user;
    } catch (error) {
      console.error("❌ Error fetching user by UID:", error);
      throw error;
    }
  };

  const listBlogsByAuthor = async (authorEmail) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!["admin"].includes(currentUser.role) && currentUser.email !== authorEmail) {
      throw new Error("Unauthorized: You can only view your own blogs or are not an admin.");
    }
    
    try {
      console.log("📝 Fetching blogs by author:", authorEmail);
      const response = await fetch(`${API_BASE_URL}/posts/by-author`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: authorEmail,
          requesterRole: currentUser.role,
          requesterEmail: currentUser.email,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch blogs by author');
      }
      
      const blogs = await response.json();
      console.log("✅ Author blogs fetched:", blogs.length);
      return blogs;
    } catch (error) {
      console.error("❌ Error listing blogs by author:", error);
      throw error;
    }
  };

  const changeUserRole = async (uid, newRole) => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can change user roles");
    
    try {
      console.log("🔄 Changing user role:", { uid, newRole });
      const response = await fetch(`${API_BASE_URL}/users/${uid}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
          requesterRole: currentUser.role,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change user role');
      }
      
      const result = await response.json();
      console.log("✅ User role changed:", result);
      return result;
    } catch (error) {
      console.error("❌ Error changing user role:", error);
      throw error;
    }
  };

  const toggleUserStatus = async (uid, isDisabled) => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can change user status");
    
    try {
      console.log("🔄 Toggling user status:", { uid, isDisabled });
      const response = await fetch(`${API_BASE_URL}/users/${uid}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isDisabled: isDisabled,
          requesterRole: currentUser.role,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle user status');
      }
      
      const result = await response.json();
      console.log("✅ User status toggled:", result);
      return result;
    } catch (error) {
      console.error("❌ Error toggling user status:", error);
      throw error;
    }
  };

  const toggleManageAllBlogsAccess = async (uid, canManageAllBlogs) => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can change blog management access");
    
    try {
      console.log("🔄 Toggling canManageAllBlogs access:", { uid, canManageAllBlogs });
      const response = await fetch(`${API_BASE_URL}/users/${uid}/manage-all-blogs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canManageAllBlogs: canManageAllBlogs,
          requesterRole: currentUser.role,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle blog management access');
      }
      
      const result = await response.json();
      console.log("✅ Blog management access toggled:", result);
      // Update currentUser if it's the superadmin changing their own permissions
      if (currentUser.uid === uid) {
        const updatedUser = { ...currentUser, canManageAllBlogs: canManageAllBlogs ? 1 : 0 };
        setCurrentUser(updatedUser);
        Storage.set("currentUser", updatedUser);
      }
      return result;
    } catch (error) {
      console.error("❌ Error toggling blog management access:", error);
      throw error;
    }
  };

  const deleteUser = async (uid) => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can delete users");
    
    try {
      console.log("🗑️ Deleting user:", uid);
      const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterRole: currentUser.role,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      console.log("✅ User deleted");
      return true;
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      throw error;
    }
  };

  const resetPassword = (email) => {
    console.log(`Password reset requested for ${email}. (Simulated: Check your inbox)`);
    return Promise.resolve();
  };

  const updateName = async (newName) => {
    if (!currentUser) throw new Error("Not logged in");
    try {
      console.log("🔄 Updating user name:", { uid: currentUser.uid, newName });
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.uid}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: newName,
          requesterRole: currentUser.role,
          requesterUid: currentUser.uid,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update name');
      }
      const updatedUser = { ...currentUser, displayName: newName };
      setCurrentUser(updatedUser);
      Storage.set("currentUser", updatedUser);
      console.log("✅ User name updated:", updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("❌ Error updating user name:", error);
      throw error;
    }
  };

  const updateEmail = async (newEmail) => {
    if (!currentUser) throw new Error("Not logged in");
    try {
      console.log("🔄 Updating user email:", { uid: currentUser.uid, newEmail });
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.uid}/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          requesterRole: currentUser.role,
          requesterUid: currentUser.uid,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update email');
      }
      const updatedUser = { ...currentUser, email: newEmail };
      setCurrentUser(updatedUser);
      Storage.set("currentUser", updatedUser);
      console.log("✅ User email updated:", updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("❌ Error updating user email:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    if (!currentUser) throw new Error("Not logged in");
    try {
      console.log("🔄 Updating user password:", { uid: currentUser.uid });
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.uid}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
          requesterRole: currentUser.role,
          requesterUid: currentUser.uid,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }
      const updatedUser = { ...currentUser, password: newPassword }; // Assuming password is also stored in currentUser
      setCurrentUser(updatedUser);
      Storage.set("currentUser", updatedUser);
      console.log("✅ User password updated.");
      return updatedUser;
    } catch (error) {
      console.error("❌ Error updating user password:", error);
      throw error;
    }
  };

  const updateProfilePicture = async (newPhotoURL) => {
    if (!currentUser) throw new Error("Not logged in");
    try {
      console.log("🔄 Updating user profile picture:", { uid: currentUser.uid, newPhotoURL });
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.uid}/photoURL`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoURL: newPhotoURL,
          requesterRole: currentUser.role,
          requesterUid: currentUser.uid,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile picture');
      }
      const updatedUser = { ...currentUser, photoURL: newPhotoURL };
      setCurrentUser(updatedUser);
      Storage.set("currentUser", updatedUser);
      console.log("✅ User profile picture updated:", updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("❌ Error updating profile picture:", error);
      throw error;
    }
  };

  const listAdmins = async () => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can list admins");
    try {
      console.log("👥 Fetching admin users list");
      const response = await fetch(`${API_BASE_URL}/users/admins?requesterRole=${currentUser.role}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch admin users');
      }
      const admins = await response.json();
      console.log("✅ Admin users fetched:", admins.length);
      return admins;
    } catch (error) {
      console.error("❌ Error listing admin users:", error);
      throw error;
    }
  };

  const getBlogSpecificAccess = async (postId) => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can view blog-specific access");
    try {
      console.log("🔍 Fetching blog-specific access for post:", postId);
      const response = await fetch(`${API_BASE_URL}/blog-access/post/${postId}?requesterRole=${currentUser.role}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch blog-specific access');
      }
      const accessRecords = await response.json();
      console.log("✅ Blog-specific access records fetched:", accessRecords.length);
      return accessRecords;
    } catch (error) {
      console.error("❌ Error fetching blog-specific access:", error);
      throw error;
    }
  };

  const grantBlogSpecificAccess = async (userUid, postId) => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can grant blog-specific access");
    try {
      console.log("➕ Granting specific blog access:", { userUid, postId });
      const response = await fetch(`${API_BASE_URL}/blog-access/grant-specific`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userUid,
          postId,
          requesterRole: currentUser.role,
          requesterUid: currentUser.uid,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grant specific blog access');
      }
      const result = await response.json();
      console.log("✅ Specific blog access granted:", result);
      return result;
    } catch (error) {
      console.error("❌ Error granting specific blog access:", error);
      throw error;
    }
  };

  const revokeBlogSpecificAccess = async (userUid, postId) => {
    if (!currentUser) throw new Error("Not logged in");
    if (currentUser.role !== "superadmin") throw new Error("Unauthorized: Only superadmins can revoke blog-specific access");
    try {
      console.log("➖ Revoking specific blog access:", { userUid, postId });
      const response = await fetch(`${API_BASE_URL}/blog-access/revoke-specific`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userUid,
          postId,
          requesterRole: currentUser.role,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke specific blog access');
      }
      const result = await response.json();
      console.log("✅ Specific blog access revoked:", result);
      return result;
    } catch (error) {
      console.error("❌ Error revoking specific blog access:", error);
      throw error;
    }
  };

  const checkBlogSpecificAccess = async (adminUid, postId) => {
    if (!currentUser) throw new Error("Not logged in");
    if (!["admin", "superadmin"].includes(currentUser.role)) throw new Error("Unauthorized: Only admins and superadmins can check blog access");
    try {
      console.log("🧐 Checking blog-specific access for admin:", { adminUid, postId });
      const response = await fetch(`${API_BASE_URL}/blog-access/admin/${adminUid}/${postId}?requesterRole=${currentUser.role}&requesterUid=${currentUser.uid}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check blog-specific access');
      }
      const result = await response.json();
      console.log("✅ Blog-specific access check result:", result);
      return result.hasAccess; // Assuming backend returns { hasAccess: true/false }
    } catch (error) {
      console.error("❌ Error checking blog-specific access:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        signup,
        login,
        logout,
        createBlog,
        editBlog,
        deleteBlog,
        getBlogById,
        listBlogs,
        listUsers,
        resetPassword,
        loading,
        isAdmin: currentUser && currentUser.role === "admin",
        isSuperAdmin: currentUser && currentUser.role === "superadmin",
        canManageAllBlogs: currentUser && currentUser.canManageAllBlogs === 1,
        getUserByUid,
        listBlogsByAuthor,
        changeUserRole,
        toggleUserStatus,
        deleteUser,
        toggleManageAllBlogsAccess,
        updateName,
        updateEmail,
        updatePassword,
        updateProfilePicture,
        listAdmins,
        getBlogSpecificAccess,
        grantBlogSpecificAccess,
        revokeBlogSpecificAccess,
        checkBlogSpecificAccess, // New function added
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}