# -----------------------
# Base Image
# -----------------------
FROM node:22-alpine

# -----------------------
# Backend
# -----------------------

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm install

COPY backend ./

# -----------------------
# Frontend
# -----------------------

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend ./

RUN npm run build

# -----------------------
# Start Backend
# -----------------------

WORKDIR /app/backend

EXPOSE 5000

CMD ["npm", "start"]