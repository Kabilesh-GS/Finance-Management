/**
 * Financial Predictor Model
 * Predicts next month's expenses, income, and savings based on historical data
 */

class FinancialPredictor {
  constructor() {
    this.expenseModel = new ExpensePredictor();
    this.incomeModel = new IncomePredictor();
    this.savingsModel = new SavingsPredictor();
  }

  /**
   * Predict next month's financial metrics
   * @param {Array} transactions - Historical transaction data
   * @param {Array} budgets - Current budget data
   * @returns {Object} Predictions for next month
   */
  predictNextMonth(transactions, budgets) {
    const historicalData = this.prepareHistoricalData(transactions);

    const expensePrediction = this.expenseModel.predict(historicalData);
    const incomePrediction = this.incomeModel.predict(historicalData);
    const savingsPrediction = this.savingsModel.predict(
      incomePrediction,
      expensePrediction
    );

    return {
      month: this.getNextMonth(),
      predictions: {
        expenses: expensePrediction,
        income: incomePrediction,
        savings: savingsPrediction,
        confidence: this.calculateConfidence(historicalData),
      },
      insights: this.generateInsights(
        expensePrediction,
        incomePrediction,
        savingsPrediction,
        budgets
      ),
    };
  }

  /**
   * Prepare historical data for analysis
   */
  prepareHistoricalData(transactions) {
    const monthlyData = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, categories: {} };
      }

      if (transaction.type === "income") {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
        monthlyData[monthKey].categories[transaction.category] =
          (monthlyData[monthKey].categories[transaction.category] || 0) +
          transaction.amount;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month - b.month);
  }

  /**
   * Get next month string
   */
  getNextMonth() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  }

  /**
   * Calculate prediction confidence based on data quality
   */
  calculateConfidence(historicalData) {
    if (historicalData.length < 2) return 0.3;
    if (historicalData.length < 6) return 0.6;
    return 0.85;
  }

  /**
   * Generate insights based on predictions
   */
  generateInsights(expensePred, incomePred, savingsPred, budgets) {
    const insights = [];

    // Savings rate insight
    const savingsRate = (savingsPred / incomePred) * 100;
    if (savingsRate > 20) {
      insights.push({
        type: "positive",
        message: `Excellent savings rate predicted: ${savingsRate.toFixed(1)}%`,
      });
    } else if (savingsRate < 10) {
      insights.push({
        type: "warning",
        message: `Low savings rate predicted: ${savingsRate.toFixed(
          1
        )}%. Consider reducing expenses.`,
      });
    }

    // Budget comparison
    const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
    const budgetUtilization = (expensePred / totalBudget) * 100;

    if (budgetUtilization > 100) {
      insights.push({
        type: "danger",
        message: `Predicted expenses (₹${expensePred.toLocaleString()}) exceed total budget by ${(
          budgetUtilization - 100
        ).toFixed(1)}%`,
      });
    } else if (budgetUtilization > 90) {
      insights.push({
        type: "warning",
        message: `Predicted expenses will use ${budgetUtilization.toFixed(
          1
        )}% of total budget`,
      });
    }

    return insights;
  }
}

/**
 * Expense Prediction Model
 * Uses trend analysis and seasonal patterns
 */
class ExpensePredictor {
  predict(historicalData) {
    if (historicalData.length === 0) return 0;

    // Simple moving average with trend
    const expenses = historicalData.map((data) => data.expenses);
    const avgExpense =
      expenses.reduce((sum, exp) => sum + exp, 0) / expenses.length;

    // Calculate trend
    let trend = 0;
    if (expenses.length >= 2) {
      const recent = expenses.slice(-3); // Last 3 months
      const older = expenses.slice(-6, -3); // Previous 3 months
      if (older.length > 0) {
        const recentAvg =
          recent.reduce((sum, exp) => sum + exp, 0) / recent.length;
        const olderAvg =
          older.reduce((sum, exp) => sum + exp, 0) / older.length;
        trend = (recentAvg - olderAvg) / olderAvg;
      }
    }

    // Apply trend to prediction
    const prediction = avgExpense * (1 + trend * 0.5); // Dampen trend effect

    return Math.max(0, Math.round(prediction));
  }
}

/**
 * Income Prediction Model
 * Uses trend analysis and growth patterns
 */
class IncomePredictor {
  predict(historicalData) {
    if (historicalData.length === 0) return 0;

    const incomes = historicalData.map((data) => data.income);
    const avgIncome =
      incomes.reduce((sum, inc) => sum + inc, 0) / incomes.length;

    // Calculate growth trend
    let growthTrend = 0;
    if (incomes.length >= 2) {
      const recent = incomes.slice(-3);
      const older = incomes.slice(-6, -3);
      if (older.length > 0) {
        const recentAvg =
          recent.reduce((sum, inc) => sum + inc, 0) / recent.length;
        const olderAvg =
          older.reduce((sum, inc) => sum + inc, 0) / older.length;
        growthTrend = (recentAvg - olderAvg) / olderAvg;
      }
    }

    // Apply growth trend
    const prediction = avgIncome * (1 + growthTrend * 0.3); // Conservative growth

    return Math.max(0, Math.round(prediction));
  }
}

/**
 * Savings Prediction Model
 * Calculates savings based on income and expense predictions
 */
class SavingsPredictor {
  predict(incomePred, expensePred) {
    return Math.max(0, incomePred - expensePred);
  }
}

export default FinancialPredictor;
