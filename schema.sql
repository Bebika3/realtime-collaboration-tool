-- PostgreSQL Schema - schema.sql

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES documents(id),
    user_id INT REFERENCES users(id),
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    can_view BOOLEAN NOT NULL DEFAULT TRUE
);