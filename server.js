const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5001;

// ✅ Allow multiple Vite ports + credentials
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like curl or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database setup
const dbPath = path.join(__dirname, 'blog.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    
    // Create tables if they don't exist
    db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
      subHeading TEXT,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        date TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        category TEXT
      )`, (err) => {
        if (err) console.error('Error creating posts table:', err);
        else console.log('Posts table ready');
      });

      // New blog_categories table
      db.run(`CREATE TABLE IF NOT EXISTS blog_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )`, (err) => {
        if (err) console.error('Error creating blog_categories table:', err);
        else console.log('Blog categories table ready');
      });
      
    db.run(`CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
      displayName TEXT,
      photoURL TEXT,
      role TEXT DEFAULT 'user',
        isDisabled INTEGER DEFAULT 0,
        canManageAllBlogs INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table ready');
      });

      // NEW TABLE: Blog Access Control
      db.run(`CREATE TABLE IF NOT EXISTS blog_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uid TEXT NOT NULL,
        post_id TEXT NOT NULL,
        granted_by TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users (uid),
        FOREIGN KEY (post_id) REFERENCES posts (id),
        FOREIGN KEY (granted_by) REFERENCES users (uid),
        UNIQUE(user_uid, post_id)
      )`, (err) => {
        if (err) console.error('Error creating blog_access table:', err);
        else console.log('Blog access table ready');
      });

      // Add category column to posts table if it doesn't exist
      db.all(`PRAGMA table_info(posts)`, [], (err, columns) => {
        if (err) { console.error('Error checking posts table info:', err); return; }
        const hasCategory = columns.some(col => col.name === 'category');
        if (!hasCategory) {
          db.run(`ALTER TABLE posts ADD COLUMN category TEXT`, (alterErr) => {
            if (alterErr) console.error('Error adding category column:', alterErr);
            else console.log('✅ Added category column to posts table');
          });
        }
      });

      // Add canManageAllBlogs column if it doesn't exist
      db.all(`PRAGMA table_info(users)`, [], (err, columns) => {
        if (err) { console.error('Error checking users table info:', err); return; }
        const hasCanManageAllBlogs = columns.some(col => col.name === 'canManageAllBlogs');
        if (!hasCanManageAllBlogs) {
          db.run(`ALTER TABLE users ADD COLUMN canManageAllBlogs INTEGER DEFAULT 0`, (alterErr) => {
            if (alterErr) console.error('Error adding canManageAllBlogs column:', alterErr);
            else console.log('✅ Added canManageAllBlogs column to users table');
          });
        }
        const hasDisplayName = columns.some(col => col.name === 'displayName');
        if (!hasDisplayName) {
          db.run(`ALTER TABLE users ADD COLUMN displayName TEXT`, (alterErr) => {
            if (alterErr) console.error('Error adding displayName column:', alterErr);
            else console.log('✅ Added displayName column to users table');
          });
        }
 
        const hasPhotoURL = columns.some(col => col.name === 'photoURL');
        if (!hasPhotoURL) {
          db.run(`ALTER TABLE users ADD COLUMN photoURL TEXT`, (alterErr) => {
            if (alterErr) console.error('Error adding photoURL column:', alterErr);
            else console.log('✅ Added photoURL column to users table');
          });
        }
      });

      // Create a default superadmin user if none exists
      db.get("SELECT * FROM users WHERE role = 'superadmin'", [], (err, row) => {
        if (err) {
          console.error('Error checking for superadmin:', err);
        } else if (!row) {
          const superAdminUid = 'superadmin_' + Date.now();
          db.run(
            "INSERT INTO users (uid, email, password, role) VALUES (?, ?, ?, ?)",
            [superAdminUid, 'superadmin@blog.com', 'admin123', 'superadmin'],
            function(err) {
              if (err) {
                console.error('Error creating default superadmin:', err);
              } else {
                console.log('✅ Default superadmin created: superadmin@blog.com / admin123');
              }
            }
          );
        }
      });
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// Helper function to validate user roles
const validateRole = (role) => {
  const validRoles = ['user', 'admin', 'superadmin'];
  return validRoles.includes(role);
};

// Helper function to check if admin has access to specific blog
const checkBlogAccess = (adminUid, postId, callback) => {
  // First check if admin has global access
  db.get(`SELECT canManageAllBlogs FROM users WHERE uid = ?`, [adminUid], (err, user) => {
    if (err) return callback(err, false);
    if (user && user.canManageAllBlogs === 1) {
      return callback(null, true);
    }
    
    // Check specific blog access
    db.get(`SELECT * FROM blog_access WHERE user_uid = ? AND post_id = ?`, [adminUid, postId], (err, access) => {
      if (err) return callback(err, false);
      callback(null, !!access);
    });
  });
};

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Blog Backend API is running!',
    version: '1.0.0',
    endpoints: {
      posts: '/posts',
      users: '/users',
      auth: '/users/login, /users/signup',
      blogAccess: '/blog-access'
    }
  });
});

// ========== BLOG ACCESS CONTROL ROUTES ==========

// Grant blog access to admin (superadmin only)
app.post('/blog-access/grant', (req, res) => {
  const { userUid, postId, requesterRole, requesterUid } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can grant blog access' });
  }

  if (!userUid || !postId) {
    return res.status(400).json({ error: 'User UID and Post ID are required' });
  }

  // Verify the user exists and is an admin
  db.get(`SELECT role FROM users WHERE uid = ?`, [userUid], (err, user) => {
    if (err) {
      console.error('Error checking user role:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'Access can only be granted to admin users' });
    }

    // Verify the post exists
    db.get(`SELECT id FROM posts WHERE id = ?`, [postId], (err, post) => {
      if (err) {
        console.error('Error checking post:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Grant access (INSERT OR IGNORE to avoid duplicates)
      db.run(
        `INSERT OR IGNORE INTO blog_access (user_uid, post_id, granted_by) VALUES (?, ?, ?)`,
        [userUid, postId, requesterUid],
        function (err) {
          if (err) {
            console.error('Error granting blog access:', err);
            return res.status(500).json({ error: err.message });
          }
          console.log(`✅ Blog access granted: User ${userUid} -> Post ${postId}`);
          res.status(201).json({ message: 'Blog access granted successfully' });
        }
      );
    });
  });
});

// Revoke blog access from admin (superadmin only)
app.delete('/blog-access/revoke', (req, res) => {
  const { userUid, postId, requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can revoke blog access' });
  }

  if (!userUid || !postId) {
    return res.status(400).json({ error: 'User UID and Post ID are required' });
  }

  db.run(
    `DELETE FROM blog_access WHERE user_uid = ? AND post_id = ?`,
    [userUid, postId],
    function (err) {
      if (err) {
        console.error('Error revoking blog access:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Access record not found' });
      }
      console.log(`✅ Blog access revoked: User ${userUid} -> Post ${postId}`);
      res.json({ message: 'Blog access revoked successfully' });
    }
  );
});

// Get admin's accessible blogs
app.get('/blog-access/admin/:uid', (req, res) => {
  const { uid } = req.params;
  const { requesterRole, requesterUid } = req.query;

  // Only superadmin or the admin themselves can view their accessible blogs
  if (requesterRole !== 'superadmin' && requesterUid !== uid) {
    return res.status(403).json({ error: 'Unauthorized: Cannot view other admin\'s blog access' });
  }

  // First check if admin has global access
  db.get(`SELECT canManageAllBlogs FROM users WHERE uid = ?`, [uid], (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.canManageAllBlogs === 1) {
      // Return all blogs if admin has global access
      db.all(`SELECT * FROM posts ORDER BY date DESC`, [], (err, posts) => {
        if (err) {
          console.error('Error fetching all posts:', err);
          return res.status(500).json({ error: err.message });
        }
        console.log(`✅ Fetched ${posts.length} posts (global access) for admin: ${uid}`);
        res.json(posts);
      });
    } else {
      // Return only specifically granted blogs
      db.all(`
        SELECT p.* FROM posts p
        INNER JOIN blog_access ba ON p.id = ba.post_id
        WHERE ba.user_uid = ?
        ORDER BY p.date DESC
      `, [uid], (err, posts) => {
        if (err) {
          console.error('Error fetching accessible posts:', err);
          return res.status(500).json({ error: err.message });
        }
        console.log(`✅ Fetched ${posts.length} accessible posts for admin: ${uid}`);
        res.json(posts);
      });
    }
  });
});

// Get all blog access records (superadmin only)
app.get('/blog-access', (req, res) => {
  const { requesterRole } = req.query;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can view all access records' });
  }

  db.all(`
    SELECT 
      ba.*,
      u.email as user_email,
      p.title as post_title,
      gb.email as granted_by_email
    FROM blog_access ba
    INNER JOIN users u ON ba.user_uid = u.uid
    INNER JOIN posts p ON ba.post_id = p.id
    INNER JOIN users gb ON ba.granted_by = gb.uid
    ORDER BY ba.createdAt DESC
  `, [], (err, records) => {
    if (err) {
      console.error('Error fetching blog access records:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Fetched ${records.length} blog access records`);
    res.json(records);
  });
});


// New API: Get blog stats
app.get('/blog-stats', (req, res) => {
  db.all(`
    SELECT
      (SELECT COUNT(*) FROM posts) AS totalBlogs,
      (SELECT COUNT(*) FROM users WHERE role = 'admin') AS totalAdmins
  `, [], (err, stats) => {
    if (err) {
      console.error('Error fetching blog stats:', err);
      return res.status(500).json({ error: err.message });
    }

    db.all(`
      SELECT category, COUNT(*) AS count FROM posts GROUP BY category
    `, [], (err, categories) => {
      if (err) {
        console.error('Error fetching category counts:', err);
        return res.status(500).json({ error: err.message });
      }

      db.all(`
        SELECT author, COUNT(*) AS count FROM posts WHERE author IN (SELECT email FROM users WHERE role = 'admin') GROUP BY author
      `, [], (err, admins) => {
        if (err) {
          console.error('Error fetching admin post counts:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          totalBlogs: stats[0].totalBlogs,
          totalAdmins: stats[0].totalAdmins,
          categories,
          admins
        });
      });
    });
  });
});


// New API: Get all blog categories
app.get('/blog-categories', (req, res) => {
  db.all(`SELECT * FROM blog_categories ORDER BY name ASC`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


// New API: Create a new blog category (superadmin only)
app.post('/blog-categories', (req, res) => {
  const { name, requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can create categories' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  db.run(`INSERT INTO blog_categories (name) VALUES (?)`, [name], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Category with this name already exists' });
      }
      console.error('Error creating category:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name: name });
  });
});


// New API: Delete a blog category (superadmin only)
app.delete('/blog-categories/:id', (req, res) => {
  const { id } = req.params;
  const { requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can delete categories' });
  }

  db.run(`DELETE FROM blog_categories WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error('Error deleting category:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});


// ========== POSTS ROUTES (Updated with access control) ==========

// Create a new post
app.post('/posts', (req, res) => {
  const { id, title, subHeading, content, author, date, requesterRole, category } = req.body;
  
  if (!['admin', 'superadmin'].includes(requesterRole)) {
    return res.status(403).json({ error: 'Unauthorized: Only admins and superadmins can create posts' });
  }

  if (!id || !title || !content || !author || !date) {
    return res.status(400).json({ error: 'Missing required fields: id, title, content, author, date' });
  }

  // Validate category
  if (category) {
    db.get(`SELECT name FROM blog_categories WHERE name = ?`, [category], (err, row) => {
      if (err || !row) {
        return res.status(400).json({ error: 'Invalid blog category selected' });
      }
      insertPost(id, title, subHeading, content, author, date, category, res);
    });
  } else {
    insertPost(id, title, subHeading, content, author, date, null, res);
  }
});

function insertPost(id, title, subHeading, content, author, date, category, res) {
  db.run(
    `INSERT INTO posts (id, title, subHeading, content, author, date, category) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, title, subHeading || '', content, author, date, category],
    function (err) {
      if (err) {
        console.error('Error creating post:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('✅ Post created:', { id, title, author });
      res.status(201).json({ 
        message: 'Post created successfully',
        id: id,
        postId: this.lastID 
      });
    }
  );
}


// Get all posts
app.get('/posts', (req, res) => {
  db.all(`SELECT * FROM posts ORDER BY date DESC`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Fetched ${rows.length} posts`);
    res.json(rows);
  });
});

// Get single post by ID
app.get('/posts/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM posts WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Error fetching post:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'Post not found' });
    }
    console.log('✅ Post fetched:', row.title);
    res.json(row);
  });
});

// Update post (Enhanced with granular access control)
app.put('/posts/:id', (req, res) => {
  const { id } = req.params;
  const { title, subHeading, content, author, date, requesterRole, requesterUid, category } = req.body;

  if (!['admin', 'superadmin'].includes(requesterRole)) {
    return res.status(403).json({ error: 'Unauthorized: Only admins and superadmins can edit posts' });
  }

  if (!title || !content || !author || !date) {
    return res.status(400).json({ error: 'Missing required fields: title, content, author, date' });
  }

  // For superadmin, directly update
  if (requesterRole === 'superadmin') {
    db.run(
      `UPDATE posts SET title = ?, subHeading = ?, content = ?, author = ?, date = ?, category = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, subHeading || '', content, author, date, category || null, id],
      function (err) {
        if (err) {
          console.error('Error updating post:', err);
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Post not found or no changes made' });
        }
        console.log('✅ Post updated by superadmin:', id);
        res.json({ message: 'Post updated successfully' });
      }
    );
  } else { // requesterRole === 'admin'
    // Check if admin has access to this specific blog
    checkBlogAccess(requesterUid, id, (err, hasAccess) => {
      if (err) {
        console.error('Error checking blog access:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!hasAccess) {
        // Check if admin is the author
        db.get(`SELECT author FROM posts WHERE id = ?`, [id], (err, post) => {
          if (err) {
            console.error('Error checking post author:', err);
            return res.status(500).json({ error: err.message });
          }
          if (!post) {
            return res.status(404).json({ message: 'Post not found' });
          }
          if (post.author !== author) {
            return res.status(403).json({ error: 'Unauthorized: You don\'t have access to edit this blog' });
          }
          
          // Admin is the author, allow update
  db.run(
            `UPDATE posts SET title = ?, subHeading = ?, content = ?, author = ?, date = ?, category = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            [title, subHeading || '', content, author, date, category || null, id],
    function (err) {
              if (err) {
                console.error('Error updating post:', err);
                return res.status(500).json({ error: err.message });
              }
              console.log('✅ Post updated by author-admin:', id);
      res.json({ message: 'Post updated successfully' });
    }
  );
        });
      } else {
        // Admin has access, allow update
        db.run(
          `UPDATE posts SET title = ?, subHeading = ?, content = ?, author = ?, date = ?, category = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
          [title, subHeading || '', content, author, date, category || null, id],
          function (err) {
            if (err) {
              console.error('Error updating post:', err);
              return res.status(500).json({ error: err.message });
            }
            console.log('✅ Post updated by authorized admin:', id);
            res.json({ message: 'Post updated successfully' });
          }
        );
      }
    });
  }
});

// Delete post (Enhanced with granular access control)
app.delete('/posts/:id', (req, res) => {
  const { id } = req.params;
  const { requesterRole, requesterEmail, requesterUid } = req.body;

  if (!['admin', 'superadmin'].includes(requesterRole)) {
    return res.status(403).json({ error: 'Unauthorized: Only admins and superadmins can delete posts' });
  }

  // For superadmin, directly delete
  if (requesterRole === 'superadmin') {
    db.run(`DELETE FROM posts WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error('Error deleting post:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }
      // Clean up access records
      db.run(`DELETE FROM blog_access WHERE post_id = ?`, [id]);
      console.log('✅ Post deleted by superadmin:', id);
      res.json({ message: 'Post deleted successfully' });
    });
  } else { // requesterRole === 'admin'
    // Check if admin has access to this specific blog
    checkBlogAccess(requesterUid, id, (err, hasAccess) => {
      if (err) {
        console.error('Error checking blog access:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!hasAccess) {
        // Check if admin is the author
        db.get(`SELECT author FROM posts WHERE id = ?`, [id], (err, post) => {
          if (err) {
            console.error('Error checking post author:', err);
            return res.status(500).json({ error: err.message });
          }
          if (!post) {
            return res.status(404).json({ message: 'Post not found' });
          }
          if (post.author !== requesterEmail) {
            return res.status(403).json({ error: 'Unauthorized: You don\'t have access to delete this blog' });
          }
          
          // Admin is the author, allow deletion
  db.run(`DELETE FROM posts WHERE id = ?`, [id], function (err) {
            if (err) {
              console.error('Error deleting post:', err);
              return res.status(500).json({ error: err.message });
            }
            // Clean up access records
            db.run(`DELETE FROM blog_access WHERE post_id = ?`, [id]);
            console.log('✅ Post deleted by author-admin:', id);
    res.json({ message: 'Post deleted successfully' });
  });
});
      } else {
        // Admin has access, allow deletion
        db.run(`DELETE FROM posts WHERE id = ?`, [id], function (err) {
          if (err) {
            console.error('Error deleting post:', err);
            return res.status(500).json({ error: err.message });
          }
          // Clean up access records
          db.run(`DELETE FROM blog_access WHERE post_id = ?`, [id]);
          console.log('✅ Post deleted by authorized admin:', id);
          res.json({ message: 'Post deleted successfully' });
        });
      }
    });
  }
});

// Get posts by author
app.post('/posts/by-author', (req, res) => {
  const { author, requesterRole, requesterEmail } = req.body;

  if (!author) {
    return res.status(400).json({ error: 'Author email is required' });
  }

  if (!requesterRole || (requesterRole !== 'admin' && requesterEmail !== author)) {
    return res.status(403).json({ error: 'Unauthorized: You can only view your own blogs or are not an admin.' });
  }

  db.all(`SELECT * FROM posts WHERE author = ? ORDER BY date DESC`, [author], (err, rows) => {
    if (err) {
      console.error('Error fetching posts by author:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Fetched ${rows.length} posts by author: ${author}`);
    res.json(rows);
  });
});

// ========== USER ROUTES ==========

// User signup
app.post('/users/signup', (req, res) => {
  const { email, password, role, displayName, photoURL } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const userRole = role || 'user';
  if (!validateRole(userRole)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  const uid = Date.now().toString(); // simple UID
  
  db.run(
    `INSERT INTO users (uid, email, password, role, displayName, photoURL) VALUES (?, ?, ?, ?, ?, ?)`,
    [uid, email, password, userRole, displayName || '', photoURL || ''],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'User with this email already exists' });
        }
        console.error('Error creating user:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('✅ User created:', { uid, email, role: userRole });
      res.status(201).json({ uid, email, role: userRole, isDisabled: 0 });
    }
  );
});

// User login
app.post('/users/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  console.log('Login attempt for email:', email);
  
  db.get(
    `SELECT uid, email, role, isDisabled, canManageAllBlogs, displayName, photoURL FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, row) => {
      if (err) {
        console.error('Database error during login:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log('Login failed: Invalid credentials for email:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      if (row.isDisabled) {
        console.log('Login failed: Account disabled for email:', email);
        return res.status(403).json({ error: 'Account has been disabled. Please contact administrator.' });
      }
      
      console.log('✅ Login successful for:', email);
      res.json(row);
    }
  );
});

// Get all users (admin/superadmin only) - already includes displayName and photoURL
app.get('/users', (req, res) => {
  const { requesterRole } = req.query;

  if (!['admin', 'superadmin'].includes(requesterRole)) {
    return res.status(403).json({ error: 'Unauthorized: Only admins and superadmins can list all users' });
  }

  db.all(`SELECT uid, email, role, isDisabled, canManageAllBlogs, createdAt, displayName, photoURL FROM users ORDER BY createdAt DESC`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Fetched ${rows.length} users`);
    res.json(rows);
  });
});

// Get all admin users (superadmin only)
app.get('/users/admins', (req, res) => {
  const { requesterRole } = req.query;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can list admins' });
  }

  db.all(`SELECT uid, email, displayName, photoURL FROM users WHERE role = 'admin' AND isDisabled = 0 ORDER BY email ASC`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching admin users:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Fetched ${rows.length} admin users`);
    res.json(rows);
  });
});

// Get blog-specific access records for a post (superadmin only)
app.get('/blog-access/post/:postId', (req, res) => {
  const { postId } = req.params;
  const { requesterRole } = req.query;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can view blog-specific access' });
  }

  db.all(`
    SELECT 
      ba.user_uid,
      u.email as user_email,
      u.displayName as user_displayName
    FROM blog_access ba
    INNER JOIN users u ON ba.user_uid = u.uid
    WHERE ba.post_id = ?
    ORDER BY u.email ASC
  `, [postId], (err, records) => {
    if (err) {
      console.error('Error fetching blog-specific access records:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Fetched ${records.length} blog-specific access records for post ${postId}`);
    res.json(records);
  });
});

// Check blog-specific access for an admin (admin or superadmin only)
app.get('/blog-access/admin/:adminUid/:postId', (req, res) => {
  const { adminUid, postId } = req.params;
  const { requesterRole, requesterUid } = req.query;

  if (!['admin', 'superadmin'].includes(requesterRole)) {
    return res.status(403).json({ error: 'Unauthorized: Only admins and superadmins can check blog access' });
  }

  if (requesterRole === 'admin' && requesterUid !== adminUid) {
    return res.status(403).json({ error: 'Unauthorized: Admins can only check their own blog access' });
  }

  checkBlogAccess(adminUid, postId, (err, hasAccess) => {
    if (err) {
      console.error('Error checking blog access:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Blog access check for admin ${adminUid} on post ${postId}: ${hasAccess}`);
    res.json({ hasAccess });
  });
});

// Grant specific blog access to an admin (superadmin only)
app.post('/blog-access/grant-specific', (req, res) => {
  const { userUid, postId, requesterRole, requesterUid } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can grant blog-specific access' });
  }

  if (!userUid || !postId) {
    return res.status(400).json({ error: 'User UID and Post ID are required' });
  }

  db.run(
    `INSERT OR IGNORE INTO blog_access (user_uid, post_id, granted_by) VALUES (?, ?, ?)`,
    [userUid, postId, requesterUid],
    function (err) {
      if (err) {
        console.error('Error granting specific blog access:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Specific blog access granted: User ${userUid} -> Post ${postId}`);
      res.status(201).json({ message: 'Specific blog access granted successfully' });
    }
  );
});

// Revoke specific blog access from an admin (superadmin only)
app.delete('/blog-access/revoke-specific', (req, res) => {
  const { userUid, postId, requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can revoke blog-specific access' });
  }

  if (!userUid || !postId) {
    return res.status(400).json({ error: 'User UID and Post ID are required' });
  }

  db.run(
    `DELETE FROM blog_access WHERE user_uid = ? AND post_id = ?`,
    [userUid, postId],
    function (err) {
      if (err) {
        console.error('Error revoking specific blog access:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Specific access record not found' });
      }
      console.log(`✅ Specific blog access revoked: User ${userUid} -> Post ${postId}`);
      res.json({ message: 'Specific blog access revoked successfully' });
    }
  );
});

// Get single user by UID
app.get('/users/:uid', (req, res) => {
  const { uid } = req.params;
  const { requesterRole, requesterUid } = req.query;

  if (requesterRole === 'superadmin') {
    // Superadmin can view any user
    db.get(`SELECT uid, email, role, isDisabled, createdAt, displayName, photoURL FROM users WHERE uid = ?`, [uid], (err, row) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('✅ User fetched by superadmin:', row.email);
      res.json(row);
    });
  } else if (requesterRole === 'admin' && requesterUid === uid) {
    // Admin can view their own details
    db.get(`SELECT uid, email, role, isDisabled, createdAt, displayName, photoURL FROM users WHERE uid = ?`, [uid], (err, row) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('✅ User fetched by admin (self):', row.email);
      res.json(row);
    });
  } else {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can view any user, and admins can view their own details.' });
  }
});

// Change user role (superadmin only)
app.put('/users/:uid/role', (req, res) => {
  const { uid } = req.params;
  const { role, requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can change user roles' });
  }

  if (!role || !validateRole(role)) {
    return res.status(400).json({ error: 'Valid role is required (user, admin, superadmin)' });
  }

  db.run(`UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`, [role, uid], function (err) {
    if (err) {
      console.error('Error updating user role:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    console.log(`✅ User role updated: ${uid} -> ${role}`);
    res.json({ message: 'User role updated successfully' });
  });
});

// Toggle user status (superadmin only)
app.put('/users/:uid/status', (req, res) => {
  const { uid } = req.params;
  const { isDisabled, requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can change user status' });
  }

  if (typeof isDisabled !== 'boolean') {
    return res.status(400).json({ error: 'isDisabled must be a boolean value' });
  }

  db.run(`UPDATE users SET isDisabled = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`, [isDisabled ? 1 : 0, uid], function (err) {
    if (err) {
      console.error('Error updating user status:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    const status = isDisabled ? 'disabled' : 'enabled';
    console.log(`✅ User ${status}: ${uid}`);
    res.json({ message: `User ${status} successfully` });
  });
});

// Update user display name
app.put('/users/:uid/name', (req, res) => {
  const { uid } = req.params;
  const { displayName, requesterRole, requesterUid } = req.body;

  if (requesterRole !== 'superadmin' && requesterUid !== uid) {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins or the user themselves can update name' });
  }

  if (!displayName) {
    return res.status(400).json({ error: 'Display name is required' });
  }

  db.run(`UPDATE users SET displayName = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`, [displayName, uid], function (err) {
    if (err) {
      console.error('Error updating display name:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    console.log(`✅ User display name updated: ${uid} -> ${displayName}`);
    res.json({ message: 'Display name updated successfully' });
  });
});

// Update user email
app.put('/users/:uid/email', (req, res) => {
  const { uid } = req.params;
  const { email, requesterRole, requesterUid } = req.body;

  if (requesterRole !== 'superadmin' && requesterUid !== uid) {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins or the user themselves can update email' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.run(`UPDATE users SET email = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`, [email, uid], function (err) {
    if (err) {
      console.error('Error updating email:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    console.log(`✅ User email updated: ${uid} -> ${email}`);
    res.json({ message: 'Email updated successfully' });
  });
});

// Update user password
app.put('/users/:uid/password', (req, res) => {
  const { uid } = req.params;
  const { password, requesterRole, requesterUid } = req.body;

  if (requesterRole !== 'superadmin' && requesterUid !== uid) {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins or the user themselves can update password' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  db.run(`UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`, [password, uid], function (err) {
    if (err) {
      console.error('Error updating password:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    console.log(`✅ User password updated: ${uid}`);
    res.json({ message: 'Password updated successfully' });
  });
});

// Update user profile picture
app.put('/users/:uid/photoURL', (req, res) => {
  const { uid } = req.params;
  const { photoURL, requesterRole, requesterUid } = req.body;

  if (requesterRole !== 'superadmin' && requesterUid !== uid) {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins or the user themselves can update profile picture' });
  }

  if (!photoURL) {
    return res.status(400).json({ error: 'Photo URL is required' });
  }

  db.run(`UPDATE users SET photoURL = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`, [photoURL, uid], function (err) {
    if (err) {
      console.error('Error updating photoURL:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    console.log(`✅ User photoURL updated: ${uid}`);
    res.json({ message: 'Profile picture updated successfully' });
  });
});

// Toggle admin's ability to manage all blogs (superadmin only)
app.put('/users/:uid/manage-all-blogs', (req, res) => {
  const { uid } = req.params;
  const { canManageAllBlogs, requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can change blog management access' });
  }

  if (typeof canManageAllBlogs !== 'boolean') {
    return res.status(400).json({ error: 'canManageAllBlogs must be a boolean value' });
  }

  db.run(`UPDATE users SET canManageAllBlogs = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`, [canManageAllBlogs ? 1 : 0, uid], function (err) {
    if (err) {
      console.error('Error updating canManageAllBlogs status:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    const status = canManageAllBlogs ? 'granted' : 'revoked';
    console.log(`✅ User ${uid} blog management access ${status}.`);
    res.json({ message: `User blog management access ${status} successfully` });
  });
});

// Delete user (superadmin only)
app.delete('/users/:uid', (req, res) => {
  const { uid } = req.params;
  const { requesterRole } = req.body;

  if (requesterRole !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized: Only superadmins can delete users' });
  }

  // First clean up blog access records
  db.run(`DELETE FROM blog_access WHERE user_uid = ?`, [uid], (err) => {
    if (err) console.error('Error cleaning up blog access records:', err);
    
    // Then delete the user
    db.run(`DELETE FROM users WHERE uid = ?`, [uid], function (err) {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log(`✅ User deleted: ${uid}`);
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 API endpoints available at http://localhost:${PORT}`);
  console.log(`🔐 Default superadmin: superadmin@blog.com / admin123`);
});