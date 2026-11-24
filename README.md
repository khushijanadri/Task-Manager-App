# Task Manager Application (MERN)

A full-stack task tracking application with JWT authentication, private user tasks, CRUD operations, search, status/priority filters, due dates, and dashboard statistics.

## Requirements
- Node.js 18+
- MongoDB local installation or MongoDB Atlas
- npm

## 1. Configure the backend
```bash
cd backend
cp .env.example .env
npm install
```
Edit `backend/.env` and set `MONGO_URI` and a long random `JWT_SECRET`.

Start the API:
```bash
npm run dev
```
API runs at `http://localhost:5000`.

## 2. Configure the frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Environment
Backend `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_manager
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

## API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Current user |
| GET | `/api/tasks` | Private | List tasks; supports `status`, `priority`, `search` |
| POST | `/api/tasks` | Private | Create task |
| GET | `/api/tasks/:id` | Private | Get one task |
| PUT | `/api/tasks/:id` | Private | Update task |
| DELETE | `/api/tasks/:id` | Private | Delete task |
| GET | `/api/tasks/stats` | Private | Dashboard counts |

All private endpoints require:
`Authorization: Bearer <token>`

## Notes
- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- JWT authentication protects task endpoints.
- Every task query is scoped to the authenticated user's ID.
- The frontend stores the JWT in localStorage for this learning project. For production, consider secure, HttpOnly cookies, CSRF protections, rate limiting, HTTPS, and stronger operational controls.
