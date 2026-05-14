# Connectly — Mini Social Media Platform

A small full-stack social app with user profiles, posts, comments, likes, and a follow system.

## Tech Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (no framework)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT + bcrypt

## Features
- Sign up / Sign in with JWT auth
- Create text posts (with optional image URL)
- Like / unlike posts
- Comment on posts and delete your own comments
- Follow / unfollow other users
- Personal feed (posts from people you follow + yourself)
- Explore feed (most recent posts across the platform)
- User profiles: bio, avatar URL, follower / following counts
- Edit your own profile
- Search users by username
- Suggested users to follow

## Project Structure
```
.
├── server.js              # Express entry point
├── config/db.js           # MongoDB connection
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── middleware/auth.js     # JWT auth middleware
├── routes/                # Express routers
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   └── comments.js
└── public/                # Static frontend
    ├── index.html         # Login / register
    ├── feed.html          # Main feed
    ├── profile.html       # User profile
    ├── css/styles.css
    └── js/
        ├── api.js         # Fetch helpers + session storage
        ├── shared.js      # Navbar + post rendering
        ├── auth.js
        ├── feed.js
        └── profile.js
```

## Setup

### 1. Install MongoDB
Make sure you have MongoDB running locally (default port `27017`). Either:
- Install [MongoDB Community Server](https://www.mongodb.com/try/download/community), or
- Use Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`
- Or set `MONGO_URI` to a MongoDB Atlas connection string in `.env`.

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
A `.env` file is already provided with development defaults. To customize:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mini_social
JWT_SECRET=replace_with_a_long_random_string
```

### 4. Start the server
```bash
npm start
# or with auto-reload:
npm run dev
```

Open http://localhost:5000 in your browser.

## API Reference

All endpoints (except `/api/auth/register` and `/api/auth/login`) require an `Authorization: Bearer <token>` header.

### Auth
| Method | Path                 | Description           |
|--------|----------------------|-----------------------|
| POST   | /api/auth/register   | Create an account     |
| POST   | /api/auth/login      | Login, returns token  |
| GET    | /api/auth/me         | Current user          |

### Users
| Method | Path                       | Description                    |
|--------|----------------------------|--------------------------------|
| GET    | /api/users/search?q=...    | Search users by username       |
| GET    | /api/users/suggestions     | Suggested users to follow      |
| GET    | /api/users/:id             | User profile                   |
| GET    | /api/users/:id/posts       | Posts by a user                |
| PUT    | /api/users/profile         | Update own profile             |
| POST   | /api/users/:id/follow      | Toggle follow on a user        |

### Posts
| Method | Path                  | Description               |
|--------|-----------------------|---------------------------|
| GET    | /api/posts/feed       | Personal feed             |
| GET    | /api/posts/explore    | Recent posts (everyone)   |
| POST   | /api/posts            | Create a post             |
| GET    | /api/posts/:id        | Get a post                |
| DELETE | /api/posts/:id        | Delete own post           |
| POST   | /api/posts/:id/like   | Toggle like on a post     |

### Comments
| Method | Path                       | Description           |
|--------|----------------------------|-----------------------|
| POST   | /api/comments/:postId      | Add a comment         |
| DELETE | /api/comments/:id          | Delete own comment    |

## Notes
- This is a learning project — for production you'd want rate limiting, real image uploads (S3 / Cloudinary), refresh tokens, CSRF protection, and input sanitation beyond the basic HTML escaping done on the frontend.
- The frontend stores the JWT in `localStorage` for simplicity. For production, consider httpOnly cookies.
