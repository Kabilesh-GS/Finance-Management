# Finance Management System

A modern, responsive finance management system built with React. Track your income, expenses, budgets, and generate comprehensive financial reports with Google authentication.

## Features

- 🔐 **Google Authentication**: Secure login with Google OAuth 2.0
- 🏢 **Organization Detection**: Automatically detects Gmail organization or shows "Personal Use"
- 📊 **Dashboard**: Overview of your financial health with key metrics and charts
- 💳 **Transaction Management**: Add, edit, and delete income and expense transactions
- 🎯 **Budget Tracking**: Set budgets for different categories and monitor spending
- 📈 **Financial Reports**: Detailed analytics and insights with interactive charts
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations

## Google OAuth Setup

To enable Google authentication, you need to set up Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your domain to authorized origins (e.g., `http://localhost:3000` for development)
6. Create a `.env` file in the root directory with your client ID:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Google OAuth credentials (see above)
4. Start the development server: `npm start`
