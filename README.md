# Realtime Collaboration Tool

## Overview
This project is a realtime collaboration tool designed to enhance productivity by enabling multiple users to work on shared documents simultaneously.

## Features
- Real-time editing
- User management
- Version control
- Chat functionality
- Notifications

## Architecture
The application follows a client-server architecture:
- **Client:** Built with React, responsible for the user interface.
- **Server:** Implemented using Node.js and Express, handling requests and real-time communication using WebSockets.
- **Database:** MongoDB for storing users and documents.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Bebika3/realtime-collaboration-tool.git
   cd realtime-collaboration-tool
   ```
2. Install dependencies for both client and server:
   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```

## Getting Started
1. Start the server:
   ```bash
   cd server
   npm start
   ```
2. Start the client:
   ```bash
   cd client
   npm start
   ```

Now navigate to `http://localhost:3000` to see the application in action! 

## License
This project is licensed under the MIT License.