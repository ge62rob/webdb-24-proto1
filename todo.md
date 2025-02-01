1. deploy your db on supabase 
2. once you know the db_url, config ./server/env
DB_HOST=your-supabase-db-host
DB_PORT=your-supabase-db-port
DB_USER=your-supabase-db-user
DB_PASSWORD=your-supabase-db-password
DB_NAME=your-supabase-db-name

3. deploy your backend on railway
4. once you know the backend url, config ./client/env
VITE_API_BASE=https://your-railway-backend-url/api