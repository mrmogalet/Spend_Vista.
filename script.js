// Data Models
let transactions = JSON.parse(localStorage.getItem('spendVistaTransactions')) || [];
let budget = JSON.parse(localStorage.getItem('spendVistaBudget')) || { amount: 0 };
let emergencyFund = JSON.parse(localStorage.getItem('spendVistaEmergencyFund')) || { target: 0, saved: 0, allocation: 10 };
let savingsGoals = JSON.parse(localStorage.getItem('spendVistaSavingsGoals')) || [];
let settings = JSON.parse(localStorage.getItem('spendVistaSettings')) || { darkMode: false };

// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const transactionForm = document.getElementById('transaction-form');
const budgetForm = document.getElementById('budget-form');
const emergencyForm = document.getElementById('emergency-form');
const goalForm = document.getElementById('goal-form');
const resetDataBtn = document.getElementById('reset-data');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Initialize the app
function initApp() {
    // Set current date as default for transaction form
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    // Load saved settings
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // Render initial data
    renderDashboard();
    renderBudgetPage();
    renderEmergencyPage();
    renderGoalsPage();
    renderReports();
    
    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            switchPage(pageId);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Forms
    transactionForm.addEventListener('submit', handleTransactionSubmit);
    budgetForm.addEventListener('submit', handleBudgetSubmit);
    emergencyForm.addEventListener('submit', handleEmergencySubmit);
    goalForm.addEventListener('submit', handleGoalSubmit);
    
    // Settings
    resetDataBtn.addEventListener('click', handleResetData);
    darkModeToggle.addEventListener('change', handleDarkModeToggle);
}

// Switch between pages
function switchPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });
    
    // Refresh specific page data if needed
    if (pageId === 'reports') {
        renderReports();
    }
}

// Format currency in ZAR
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Calculate financial metrics
function calculateMetrics() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = transactions
        .filter(t => t.type === 'income' && 
            new Date(t.date).getMonth() === currentMonth && 
            new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
    const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && 
            new Date(t.date).getMonth() === currentMonth && 
            new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
    const currentBalance = totalIncome - totalExpenses;
    const budgetUsed = monthlyExpenses;
    const budgetRemaining = budget.amount - budgetUsed;
    const budgetPercentage = budget.amount > 0 ? (budgetUsed / budget.amount) * 100 : 0;
    
    const emergencyPercentage = emergencyFund.target > 0 ? (emergencyFund.saved / emergencyFund.target) * 100 : 0;
    
    return {
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        budgetUsed,
        budgetRemaining,
        budgetPercentage,
        emergencyPercentage
    };
}

// Render Dashboard
function renderDashboard() {
    const metrics = calculateMetrics();
    
    // Update summary cards
    document.getElementById('current-balance').textContent = formatCurrency(metrics.currentBalance);
    document.getElementById('monthly-income').textContent = formatCurrency(metrics.monthlyIncome);
    document.getElementById('monthly-expenses').textContent = formatCurrency(metrics.monthlyExpenses);
    document.getElementById('budget-remaining').textContent = formatCurrency(metrics.budgetRemaining);
    
    // Render recent transactions
    const recentTransactionsList = document.getElementById('recent-transactions');
    recentTransactionsList.innerHTML = '';
    
    if (transactions.length === 0) {
        recentTransactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💸</div>
                <p>No transactions yet. Add your first transaction to get started!</p>
            </div>
        `;
        return;
    }
    
    // Show last 5 transactions
    const recentTransactions = transactions.slice(-5).reverse();
    
    recentTransactions.forEach(transaction => {
        const transactionItem = document.createElement('li');
        transactionItem.className = 'transaction-item';
        
        const transactionClass = transaction.type === 'income' ? 'transaction-income' : 'transaction-expense';
        const sign = transaction.type === 'income' ? '+' : '-';
        
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-name">${transaction.name}</div>
                <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
            </div>
            <div class="transaction-amount ${transactionClass}">${sign} ${formatCurrency(parseFloat(transaction.amount))}</div>
            <div class="transaction-actions">
                <button class="btn-icon delete-transaction" data-id="${transaction.id}">🗑️</button>
            </div>
        `;
        
        recentTransactionsList.appendChild(transactionItem);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-transaction').forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = e.target.closest('.delete-transaction').getAttribute('data-id');
            deleteTransaction(transactionId);
        });
    });
}

// Render Budget Page
function renderBudgetPage() {
    const metrics = calculateMetrics();
    
    // Update budget form with current values
    document.getElementById('monthly-budget').value = budget.amount;
    
    // Update progress bar
    const budgetProgress = document.getElementById('budget-progress');
    const budgetPercentage = document.getElementById('budget-percentage');
    const budgetUsed = document.getElementById('budget-used');
    const budgetRemainingDisplay = document.getElementById('budget-remaining-display');
    
    budgetProgress.style.width = `${Math.min(metrics.budgetPercentage, 100)}%`;
    budgetPercentage.textContent = `${metrics.budgetPercentage.toFixed(1)}%`;
    budgetUsed.textContent = formatCurrency(metrics.budgetUsed);
    budgetRemainingDisplay.textContent = formatCurrency(metrics.budgetRemaining);
    
    // Update progress bar color based on usage
    if (metrics.budgetPercentage >= 100) {
        budgetProgress.className = 'progress-fill progress-danger';
    } else if (metrics.budgetPercentage >= 80) {
        budgetProgress.className = 'progress-fill progress-warning';
    } else {
        budgetProgress.className = 'progress-fill progress-budget';
    }
    
    // Update budget status message
    const budgetStatus = document.getElementById('budget-status');
    if (budget.amount === 0) {
        budgetStatus.innerHTML = `
            <p>You haven't set a budget yet. Set a monthly budget to start tracking your spending.</p>
        `;
    } else if (metrics.budgetPercentage >= 100) {
        budgetStatus.innerHTML = `
            <p style="color: var(--danger); font-weight: 500;">You've exceeded your monthly budget by ${formatCurrency(Math.abs(metrics.budgetRemaining))}.</p>
        `;
    } else if (metrics.budgetPercentage >= 80) {
        budgetStatus.innerHTML = `
            <p style="color: var(--warning); font-weight: 500;">You've used ${metrics.budgetPercentage.toFixed(1)}% of your budget. Consider slowing down your spending.</p>
        `;
    } else {
        budgetStatus.innerHTML = `
            <p style="color: var(--primary); font-weight: 500;">You're on track with your budget. ${formatCurrency(metrics.budgetRemaining)} remaining for this month.</p>
        `;
    }
}

// Render Emergency Fund Page
function renderEmergencyPage() {
    // Update emergency form with current values
    document.getElementById('emergency-target-input').value = emergencyFund.target;
    document.getElementById('emergency-allocation').value = emergencyFund.allocation;
    
    // Update progress bar
    const emergencyProgress = document.getElementById('emergency-progress');
    const emergencyPercentage = document.getElementById('emergency-percentage');
    const emergencySaved = document.getElementById('emergency-saved');
    const emergencyTarget = document.getElementById('emergency-target');
    
    const percentage = emergencyFund.target > 0 ? (emergencyFund.saved / emergencyFund.target) * 100 : 0;
    
    emergencyProgress.style.width = `${Math.min(percentage, 100)}%`;
    emergencyPercentage.textContent = `${percentage.toFixed(1)}%`;
    emergencySaved.textContent = formatCurrency(emergencyFund.saved);
    emergencyTarget.textContent = formatCurrency(emergencyFund.target);
    
    // Update emergency fund status message
    const emergencyStatus = document.getElementById('emergency-status');
    if (emergencyFund.target === 0) {
        emergencyStatus.innerHTML = `
            <p>You haven't set an emergency fund goal yet. Financial experts recommend saving 3-6 months of expenses.</p>
        `;
    } else if (percentage >= 100) {
        emergencyStatus.innerHTML = `
            <p style="color: var(--primary); font-weight: 500;">Congratulations! You've reached your emergency fund goal of ${formatCurrency(emergencyFund.target)}.</p>
        `;
    } else {
        emergencyStatus.innerHTML = `
            <p>You've saved ${formatCurrency(emergencyFund.saved)} of your ${formatCurrency(emergencyFund.target)} goal. 
            ${formatCurrency(emergencyFund.target - emergencyFund.saved)} remaining.</p>
        `;
    }
}

// Render Goals Page
function renderGoalsPage() {
    const goalsList = document.getElementById('goals-list');
    
    if (savingsGoals.length === 0) {
        goalsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p>No savings goals yet. Create your first goal to start saving!</p>
            </div>
        `;
        return;
    }
    
    goalsList.innerHTML = '';
    
    savingsGoals.forEach(goal => {
        const percentage = (goal.saved / goal.target) * 100;
        const goalCard = document.createElement('div');
        goalCard.className = 'card';
        goalCard.style.marginBottom = '1rem';
        
        goalCard.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${goal.name}</h3>
                <button class="btn-icon delete-goal" data-id="${goal.id}">🗑️</button>
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${percentage.toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill progress-goal" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-label">
                    <span>Saved: ${formatCurrency(goal.saved)}</span>
                    <span>Target: ${formatCurrency(goal.target)}</span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Add to this goal</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="number" class="form-control" id="add-to-${goal.id}" placeholder="0.00" min="0.01" step="0.01">
                    <button class="btn btn-primary add-to-goal" data-id="${goal.id}">Add</button>
                </div>
            </div>
        `;
        
        goalsList.appendChild(goalCard);
    });
    
    // Add event listeners to goal buttons
    document.querySelectorAll('.delete-goal').forEach(button => {
        button.addEventListener('click', (e) => {
            const goalId = e.target.closest('.delete-goal').getAttribute('data-id');
            deleteGoal(goalId);
        });
    });
    
    document.querySelectorAll('.add-to-goal').forEach(button => {
        button.addEventListener('click', (e) => {
            const goalId = e.target.closest('.add-to-goal').getAttribute('data-id');
            const amountInput = document.getElementById(`add-to-${goalId}`);
            const amount = parseFloat(amountInput.value);
            
            if (amount && amount > 0) {
                addToGoal(goalId, amount);
                amountInput.value = '';
            }
        });
    });
}

// Render Reports Page
function renderReports() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate data for charts
    const monthlyIncome = transactions
        .filter(t => t.type === 'income' && 
            new Date(t.date).getMonth() === currentMonth && 
            new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
    const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && 
            new Date(t.date).getMonth() === currentMonth && 
            new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Income vs Expense Chart
    const incomeExpenseCtx = document.getElementById('income-expense-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.incomeExpenseChart) {
        window.incomeExpenseChart.destroy();
    }
    
    window.incomeExpenseChart = new Chart(incomeExpenseCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount (ZAR)',
                data: [monthlyIncome, monthlyExpenses],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R ' + value;
                        }
                    }
                }
            }
        }
    });
    
    // Expense Category Chart
    const expenseCategories = {};
    transactions
        .filter(t => t.type === 'expense' && 
            new Date(t.date).getMonth() === currentMonth && 
            new Date(t.date).getFullYear() === currentYear)
        .forEach(transaction => {
            // For simplicity, using the first word as category
            // In a real app, you'd have a category field
            const category = transaction.name.split(' ')[0] || 'Other';
            if (expenseCategories[category]) {
                expenseCategories[category] += parseFloat(transaction.amount);
            } else {
                expenseCategories[category] = parseFloat(transaction.amount);
            }
        });
    
    const expenseCategoryCtx = document.getElementById('expense-category-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.expenseCategoryChart) {
        window.expenseCategoryChart.destroy();
    }
    
    window.expenseCategoryChart = new Chart(expenseCategoryCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(expenseCategories),
            datasets: [{
                data: Object.values(expenseCategories),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(236, 72, 153, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Handle Transaction Form Submission
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('transaction-type').value;
    const name = document.getElementById('transaction-name').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const date = document.getElementById('transaction-date').value;
    
    const transaction = {
        id: Date.now().toString(),
        type,
        name,
        amount,
        date
    };
    
    transactions.push(transaction);
    saveData();
    
    // If it's income and emergency allocation is set, add to emergency fund
    if (type === 'income' && emergencyFund.allocation > 0) {
        const allocationAmount = (amount * emergencyFund.allocation) / 100;
        emergencyFund.saved += allocationAmount;
        saveData();
    }
    
    // Reset form
    transactionForm.reset();
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    // Update all pages
    renderDashboard();
    renderBudgetPage();
    renderEmergencyPage();
    renderReports();
    
    // Show success message
    alert('Transaction added successfully!');
}

// Handle Budget Form Submission
function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('monthly-budget').value) || 0;
    
    budget.amount = amount;
    saveData();
    
    renderBudgetPage();
    renderDashboard();
    
    alert('Budget updated successfully!');
}

// Handle Emergency Fund Form Submission
function handleEmergencySubmit(e) {
    e.preventDefault();
    
    const target = parseFloat(document.getElementById('emergency-target-input').value) || 0;
    const allocation = parseInt(document.getElementById('emergency-allocation').value) || 0;
    
    emergencyFund.target = target;
    emergencyFund.allocation = allocation;
    saveData();
    
    renderEmergencyPage();
    
    alert('Emergency fund settings updated!');
}

// Handle Goal Form Submission
function handleGoalSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    
    const goal = {
        id: Date.now().toString(),
        name,
        target,
        saved: 0
    };
    
    savingsGoals.push(goal);
    saveData();
    
    // Reset form
    goalForm.reset();
    
    renderGoalsPage();
    
    alert('Savings goal created successfully!');
}

// Delete Transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        
        renderDashboard();
        renderBudgetPage();
        renderEmergencyPage();
        renderReports();
    }
}

// Delete Goal
function deleteGoal(id) {
    if (confirm('Are you sure you want to delete this goal?')) {
        savingsGoals = savingsGoals.filter(g => g.id !== id);
        saveData();
        
        renderGoalsPage();
    }
}

// Add to Goal
function addToGoal(id, amount) {
    const goal = savingsGoals.find(g => g.id === id);
    if (goal) {
        goal.saved += amount;
        saveData();
        renderGoalsPage();
        
        alert(`Added ${formatCurrency(amount)} to ${goal.name}`);
    }
}

// Handle Reset Data
function handleResetData() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        transactions = [];
        budget = { amount: 0 };
        emergencyFund = { target: 0, saved: 0, allocation: 10 };
        savingsGoals = [];
        
        saveData();
        
        renderDashboard();
        renderBudgetPage();
        renderEmergencyPage();
        renderGoalsPage();
        renderReports();
        
        alert('All data has been reset.');
    }
}

// Handle Dark Mode Toggle
function handleDarkModeToggle() {
    settings.darkMode = darkModeToggle.checked;
    saveData();
    
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Save all data to localStorage
function saveData() {
    localStorage.setItem('spendVistaTransactions', JSON.stringify(transactions));
    localStorage.setItem('spendVistaBudget', JSON.stringify(budget));
    localStorage.setItem('spendVistaEmergencyFund', JSON.stringify(emergencyFund));
    localStorage.setItem('spendVistaSavingsGoals', JSON.stringify(savingsGoals));
    localStorage.setItem('spendVistaSettings', JSON.stringify(settings));
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);