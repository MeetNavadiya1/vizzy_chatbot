# -----------------------
# Base Image
# -----------------------
FROM node:22-alpine

# Root directory
WORKDIR /app

# -----------------------
# Backend
# -----------------------

COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm install

COPY backend .

# -----------------------
# Frontend
# -----------------------

WORKDIR /app/frontend

COPY frontend/package*.json .

RUN npm install

COPY frontend .

RUN npm run build

# -----------------------
# Back to backend
# -----------------------

WORKDIR /app/backend

EXPOSE 5000

CMD ["npm", "start"]