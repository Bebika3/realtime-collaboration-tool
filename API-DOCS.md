# API Documentation

This document provides an overview of the API functionalities of the Realtime Collaboration Tool. The API follows OpenAPI/Swagger specifications and documents the endpoints for various microservices.

## Microservices Overview

The following microservices are included in this documentation:
- **Auth Service**
- **User Service**
- **Document Service**
- **Collaboration Service**
- **File Upload Service**
- **Search Service**
- **Notification Service**

## Auth Service
### Endpoints

- **POST** `/auth/login`
  - **Description**: Authenticates user and returns a token.
  - **Request**: { "username": "string", "password": "string" }
  - **Response**: { "token": "string" }

- **POST** `/auth/logout`
  - **Description**: Logs out a user by invalidating the token.
  - **Response**: { "message": "Successfully logged out" }

## User Service
### Endpoints

- **GET** `/users`
  - **Description**: Retrieves the list of users.
  - **Response**: [ { "id": "integer", "username": "string" } ]

- **GET** `/users/{id}`
  - **Description**: Retrieves user information based on ID.
  - **Response**: { "id": "integer", "username": "string", "email": "string" }

## Document Service
### Endpoints

- **POST** `/documents`
  - **Description**: Creates a new document.
  - **Request**: { "title": "string", "content": "string" }
  - **Response**: { "id": "integer", "title": "string" }

- **GET** `/documents/{id}`
  - **Description**: Retrieves a document by ID.
  - **Response**: { "id": "integer", "title": "string", "content": "string" }

## Collaboration Service
### Endpoints

- **POST** `/collaborate`
  - **Description**: Starts a collaboration session.
  - **Request**: { "documentId": "integer", "participants": ["string"] }
  - **Response**: { "sessionId": "string" }

- **POST** `/collaborate/{sessionId}/message`
  - **Description**: Sends a message in the collaboration session.
  - **Request**: { "message": "string" }
  - **Response**: { "status": "success" }

## File Upload Service
### Endpoints

- **POST** `/upload`
  - **Description**: Uploads a file.
  - **Request**: FormData with file.
  - **Response**: { "fileUrl": "string" }

## Search Service
### Endpoints

- **GET** `/search`
  - **Description**: Searches documents or users.
  - **Request**: { "query": "string" }
  - **Response**: { "results": ["string"] }

## Notification Service
### Endpoints

- **GET** `/notifications`
  - **Description**: Retrieves notifications for the current user.
  - **Response**: [ { "id": "integer", "message": "string" } ]

## Conclusion

This API documentation aims to provide a clear understanding of how to interact with the Realtime Collaboration Tool. For more details, refer to each service's specifications directly in the respective service API.
