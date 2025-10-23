## Firebase setup

Create a `.env` file in the project root with your Firebase web app config:

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

Restart the dev server after adding env vars.

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

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Google OAuth credentials (see above)
4. Start the development server: `npm start`
