// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  me: '/auth/me',
  
  // Users
  users: '/users',
  user: (id: number) => `/users/${id}`,
  
  // Dashboard
  dashboard: '/dashboard',
  quickStats: '/dashboard/quick-stats',
  
  // Incomes
  incomes: '/incomes',
  income: (id: number) => `/incomes/${id}`,
  incomeStats: '/incomes/stats',
  
  // Expenses
  expenses: '/expenses',
  expense: (id: number) => `/expenses/${id}`,
  expenseStats: '/expenses/stats',
  expenseCategories: '/expenses/categories/summary',
  
  // Goals
  goals: '/goals',
  goal: (id: number) => `/goals/${id}`,
  goalContribute: (id: number) => `/goals/${id}/contribute`,
  goalWithdraw: (id: number) => `/goals/${id}/withdraw`,
  goalStats: '/goals/summary',  // Añadir este si no lo tienes
  goalCalculate: (id: number) => `/goals/calculate/monthly-contribution/${id}`,  // Añadir este
  
  // Investments
  investments: '/investments',
  investment: (id: number) => `/investments/${id}`,
  investmentSell: (id: number) => `/investments/${id}/sell`,
  portfolioSummary: '/investments/portfolio/summary',
  marketSearch: '/investments/market/search',
  investmentHistory: (id: number) => `/investments/${id}/history`,
}