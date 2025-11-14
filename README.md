# Maha-Heritage: A Journey Through Maharashtra's Legacy

**Maha-Heritage** is a web application dedicated to exploring the rich cultural heritage of Maharashtra, India. It provides a platform for users to discover and learn about historical sites, monuments, and cultural traditions. The application also features an AI-powered chatbot that can answer questions about Maharashtra's heritage.

## Features

- **User Authentication:** Secure user registration and login system.
- **Role-Based Access Control:** Different user roles (Public User, Research Expert, Admin) with different levels of access.
- **AI-Powered Chatbot:** An intelligent chatbot that can answer questions about Maharashtra's heritage.
- **Chat History:** Logged-in users can save and view their chat history.
- **Dashboard:** A personalized dashboard for each user role.
- **Responsive Design:** The application is designed to work on all devices.

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction), [MongoDB](https://www.mongodb.com/)
- **AI:** [Google Gemini](https://ai.google/discover/gemini/)
- **Authentication:** [JWT](https://jwt.io/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18.x or later)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/try/download/community)

### Installation

1.  **Clone the repository**

    Replace `your_username` with your actual GitHub username.

    ```sh
    git clone https://github.com/your_username/maharitage.git
    ```

2.  **Navigate to the project directory**
    ```sh
    cd maharitage
    ```
3.  **Install NPM packages**

    This will install all the necessary dependencies for the project.

    ```sh
    npm install
    ```

4.  **Set up Environment Variables**

    Create a `.env.local` file in the root of the project and add your secret keys.

    ```env
    # .env.local
    MONGODB_URI="your_mongodb_connection_string"
    NEXT_PUBLIC_API_URL="http://localhost:3000"
    JWT_SECRET="your_super_secret_jwt_key"
    ```

5.  Run the development server
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

- `GEMINI_API_KEY`: Your API key for the Google Gemini API.
- `JWT_SECRET`: A secret key for signing JWT tokens.
- `MONGODB_URI`: The connection string for your MongoDB database.

## API Endpoints

- `POST /api/auth/login`: User login.
- `POST /api/auth/register`: User registration.
- `GET /api/auth/me`: Get the currently logged-in user.
- `POST /api/ai`: Send a query to the AI chatbot.
- `GET /api/ai/chats`: Get the chat history for the logged-in user.
- `GET /api/ai/chat/:id`: Get a specific chat by ID.

## Folder Structure

```
. (root)
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js app directory
│   │   ├── api/        # API routes
│   │   ├── component/  # React components
│   │   └── ...         # Other pages
│   ├── contexts/       # React contexts
│   ├── lib/            # Helper functions and libraries
│   ├── middleware/     # Middleware functions
│   └── models/         # Mongoose models
├── .env.local          # Environment variables
├── next.config.mjs     # Next.js configuration
├── package.json        # Project dependencies
└── README.md           # This file
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
