// User types
export interface User {
    id: number
    email: string
    username: string
    full_name: string | null
    is_active: boolean
    is_superuser: boolean
    created_at: string
    updated_at: string | null
  }
  
  export interface UserCreate {
    email: string
    username: string
    full_name?: string
    password: string
  }
  
  export interface UserLogin {
    username: string
    password: string
  }
  
  export interface Token {
    access_token: string
    token_type: string
  }
  
  // Income types
  export enum IncomeType {
    SALARY = 'salary',
    FREELANCE = 'freelance',
    INVESTMENT = 'investment',
    RENTAL = 'rental',
    BUSINESS = 'business',
    GIFT = 'gift',
    OTHER = 'other',
  }
  
  export interface Income {
    id: number
    user_id: number
    amount: number
    source: string
    income_type: IncomeType
    description: string | null
    date: string
    created_at: string
    updated_at: string | null
  }
  
  export interface IncomeCreate {
    amount: number
    source: string
    income_type: IncomeType
    description?: string
    date: string
  }
  
  export interface IncomeStats {
    total_income: number
    monthly_average: number
    income_by_type: Record<string, number>
    income_by_month: Array<{
      year: number
      month: number
      total: number
    }>
    last_income_date: string | null
  }
  
  // Expense types
  export enum ExpenseCategory {
    HOUSING = 'housing',
    UTILITIES = 'utilities',
    TRANSPORTATION = 'transportation',
    GROCERIES = 'groceries',
    INSURANCE = 'insurance',
    FOOD = 'food',
    ENTERTAINMENT = 'entertainment',
    CLOTHING = 'clothing',
    HEALTH = 'health',
    EDUCATION = 'education',
    PERSONAL = 'personal',
    GIFTS = 'gifts',
    TRAVEL = 'travel',
    SHOPPING = 'shopping',
    OTHER = 'other',
  }
  
  export enum ExpenseFrequency {
    ONE_TIME = 'one_time',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
  }
  
  export interface Expense {
    id: number
    user_id: number
    amount: number
    category: ExpenseCategory
    subcategory: string | null
    description: string | null
    vendor: string | null
    frequency: ExpenseFrequency
    is_recurring: boolean
    date: string
    created_at: string
    updated_at: string | null
  }
  
  export interface ExpenseCreate {
    amount: number
    category: ExpenseCategory
    subcategory?: string
    description?: string
    vendor?: string
    frequency?: ExpenseFrequency
    is_recurring?: boolean
    date: string
  }
  
  export interface ExpenseStats {
    total_expenses: number
    monthly_average: number
    expenses_by_category: Record<string, number>
    expenses_by_month: Array<{
      year: number
      month: number
      total: number
    }>
    top_vendors: Array<{
      vendor: string
      total: number
      count: number
    }>
    recurring_expenses_total: number
    fixed_expenses: number
    variable_expenses: number
  }
  
  // Goal types
  export enum GoalStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    PAUSED = 'paused',
    CANCELLED = 'cancelled',
  }
  
  export enum GoalPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
  }
  
  export interface Goal {
    id: number
    user_id: number
    name: string
    description: string | null
    target_amount: number
    current_amount: number
    target_date: string
    status: GoalStatus
    priority: GoalPriority
    icon: string | null
    color: string | null
    monthly_contribution: number | null
    last_contribution_date: string | null
    created_at: string
    updated_at: string | null
    completed_at: string | null
    // Calculated fields
    progress_percentage: number
    remaining_amount: number
    days_remaining: number
    monthly_contribution_suggested: number
  }
  
  export interface GoalCreate {
    name: string
    description?: string
    target_amount: number
    target_date: string
    priority?: GoalPriority
    icon?: string
    color?: string
    monthly_contribution?: number
  }
  
  export interface GoalContribution {
    amount: number
  }
  
  // Investment types
  export enum InvestmentType {
    STOCK = 'stock',
    ETF = 'etf',
    MUTUAL_FUND = 'mutual_fund',
    BOND = 'bond',
    CRYPTO = 'crypto',
    REAL_ESTATE = 'real_estate',
    COMMODITY = 'commodity',
    OTHER = 'other',
  }
  
  export enum InvestmentStatus {
    ACTIVE = 'active',
    SOLD = 'sold',
    PARTIAL_SOLD = 'partial_sold',
  }
  
  export interface Investment {
    id: number
    user_id: number
    symbol: string
    name: string
    investment_type: InvestmentType
    quantity: number
    purchase_price: number
    purchase_date: string
    purchase_fees: number
    current_price: number | null
    last_price_update: string | null
    sale_quantity: number | null
    sale_price: number | null
    sale_date: string | null
    sale_fees: number
    platform: string | null
    notes: string | null
    status: InvestmentStatus
    total_invested: number | null
    current_value: number | null
    profit_loss: number | null
    profit_loss_percentage: number | null
    created_at: string
    updated_at: string | null
    // Market data fields
    real_time_price?: number
    day_change?: number
    day_change_percentage?: number
    market_status?: string
  }
  
  export interface InvestmentCreate {
    symbol: string
    name: string
    investment_type: InvestmentType
    quantity: number
    purchase_price: number
    purchase_date: string
    purchase_fees?: number
    platform?: string
    notes?: string
  }
  
  export interface InvestmentSale {
    quantity: number
    sale_price: number
    sale_fees?: number
  }
  
  export interface PortfolioSummary {
    total_invested: number
    current_value: number
    total_profit_loss: number
    total_profit_loss_percentage: number
    investments_count: number
    investments_by_type: Record<string, {
      count: number
      value: number
      invested: number
      percentage: number
    }>
    top_performers: Array<{
      id: number
      symbol: string
      name: string
      profit_loss_percentage: number
      profit_loss: number
    }>
    worst_performers: Array<{
      id: number
      symbol: string
      name: string
      profit_loss_percentage: number
      profit_loss: number
    }>
  }
  
  // Dashboard types
  export interface FinancialSummary {
    total_income: number
    total_expenses: number
    net_balance: number
    savings_rate: number
  }
  
  export interface MonthlyOverview {
    month: string
    year: number
    income: number
    expenses: number
    balance: number
  }
  
  export interface CashFlow {
    date: string
    income: number
    expenses: number
    net_flow: number
    cumulative_balance: number
  }
  
  export interface CategoryBreakdown {
    category: string
    amount: number
    percentage: number
    count: number
  }
  
  export interface GoalsSummary {
    total_goals: number
    active_goals: number
    completed_goals: number
    total_target_amount: number
    total_saved_amount: number
    overall_progress: number
  }
  
  export interface InvestmentsSummary {
    total_invested: number
    current_value: number
    total_return: number
    return_percentage: number
    best_performer: {
      symbol: string
      name: string
      profit_loss_percentage: number
    } | null
    worst_performer: {
      symbol: string
      name: string
      profit_loss_percentage: number
    } | null
  }
  
  export interface RecentTransaction {
    id: number
    type: 'income' | 'expense'
    amount: number
    description: string
    category: string
    date: string
  }
  
  export interface DashboardData {
    financial_summary: FinancialSummary
    monthly_overview: MonthlyOverview
    cash_flow: CashFlow[]
    income_by_type: CategoryBreakdown[]
    expenses_by_category: CategoryBreakdown[]
    goals_summary: GoalsSummary
    investments_summary: InvestmentsSummary
    recent_transactions: RecentTransaction[]
    average_daily_expense: number
    days_until_month_end: number
    projected_month_end_balance: number
    alerts: Array<{
      type: 'info' | 'warning' | 'danger' | 'success'
      title: string
      message: string
    }>
  }
  
  // Common types
  export interface PaginationParams {
    skip?: number
    limit?: number
  }
  
  export interface DateRangeParams {
    start_date?: string
    end_date?: string
  }
  
  export interface ApiError {
    detail: string
  }