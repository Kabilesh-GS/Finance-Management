# Finance Management System

A modern, responsive finance management system built with React. Track your income, expenses, budgets, and generate comprehensive financial reports.

## Features

- 📊 **Dashboard**: Overview of your financial health with key metrics and charts
- 💳 **Transaction Management**: Add, edit, and delete income and expense transactions
- 🎯 **Budget Tracking**: Set budgets for different categories and monitor spending
- 📈 **Financial Reports**: Detailed analytics and insights with interactive charts
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone or download the project files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Project Structure

```
src/
├── components/
│   ├── Dashboard.js          # Main dashboard with overview charts
│   ├── Transactions.js       # Transaction management interface
│   ├── Budget.js            # Budget tracking and management
│   ├── Reports.js           # Financial reports and analytics
│   ├── Sidebar.js           # Navigation sidebar
│   └── Sidebar.css          # Sidebar styling
├── App.js                   # Main application component
├── App.css                  # Application styles
├── index.js                 # Application entry point
└── index.css                # Global styles
```

## Usage

### Dashboard

- View your financial overview at a glance
- See total income, expenses, and net savings
- Monitor spending by category with pie charts
- Track monthly trends with interactive charts

### Transactions

- Add new income or expense transactions
- Search and filter transactions by type, category, or description
- Edit or delete existing transactions
- View transaction history in a clean table format

### Budget Management

- Set monthly budgets for different spending categories
- Track spending against budget limits
- Visual progress bars show budget utilization
- Get alerts when approaching or exceeding budget limits

### Reports

- Generate comprehensive financial reports
- View spending trends over time
- Analyze category-wise spending patterns
- Export reports for external use

## Technologies Used

- **React 18**: Modern React with hooks and functional components
- **Lucide React**: Beautiful, customizable icons
- **Recharts**: Composable charting library for React
- **CSS3**: Modern styling with flexbox and grid layouts
- **Responsive Design**: Mobile-first approach with media queries

## Customization

### Adding New Categories

Edit the `categories` array in `src/components/Transactions.js` to add or modify transaction categories.

### Modifying Sample Data

Update the initial state in `src/App.js` to customize the sample transactions and budgets.

### Styling

- Global styles: `src/index.css`
- Component-specific styles: `src/App.css` and `src/components/Sidebar.css`
- Use CSS custom properties for easy theme customization

## Future Enhancements

- [ ] User authentication and data persistence
- [ ] Data export to CSV/PDF
- [ ] Recurring transaction support
- [ ] Goal setting and tracking
- [ ] Bill reminders and notifications
- [ ] Multi-currency support
- [ ] Dark mode theme
- [ ] Mobile app version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions or support, please open an issue in the repository or contact the development team.
