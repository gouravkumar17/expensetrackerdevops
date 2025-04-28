document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navRight = document.querySelector('.nav-right');
    
    // Form elements
    const incomeForm = document.getElementById('income-form');
    const expenseForm = document.getElementById('expense-form');
    
    // Display elements
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const totalBalanceEl = document.getElementById('total-balance');
    const recentTransactionsEl = document.getElementById('recent-transactions');
    const incomeHistoryEl = document.getElementById('income-history');
    const expenseHistoryEl = document.getElementById('expense-history');
    const incomeSourcesEl = document.getElementById('income-sources');
    const expenseCategoriesEl = document.getElementById('expense-categories');
    
    // Chart element
    const financeChartEl = document.getElementById('finance-chart');
    let financeChart;
    
    // Data storage
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Initialize app
    init();
    
    function init() {
        // Set current date as default in forms
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('income-date').value = today;
        document.getElementById('expense-date').value = today;
        
        // Load transactions
        updateTransactions();
        updateSummary();
        updateCharts();
        
        // Event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const pageId = this.getAttribute('data-page');
                
                // Update active nav link
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
                
                // Show selected page
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
                
                // Update charts when progress page is shown
                if (pageId === 'progress') {
                    updateCharts();
                }
            });
        });
        
        // Mobile menu toggle
        mobileMenu.addEventListener('click', function() {
            navRight.classList.toggle('active');
        });
        
        // Income form submission
        incomeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const source = document.getElementById('income-source').value;
            const description = document.getElementById('income-description').value;
            const amount = parseFloat(document.getElementById('income-amount').value);
            const date = document.getElementById('income-date').value;
            
            addTransaction('income', source, description, amount, date);
            
            // Reset form
            this.reset();
            document.getElementById('income-date').value = today;
        });
        
        // Expense form submission
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const category = document.getElementById('expense-category').value;
            const description = document.getElementById('expense-description').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const date = document.getElementById('expense-date').value;
            
            addTransaction('expense', category, description, amount, date);
            
            // Reset form
            this.reset();
            document.getElementById('expense-date').value = today;
        });
    }
    
    function addTransaction(type, category, description, amount, date) {
        const transaction = {
            id: Date.now(),
            type,
            category,
            description,
            amount,
            date
        };
        
        transactions.push(transaction);
        saveTransactions();
        updateTransactions();
        updateSummary();
        
        // Update charts if on progress page
        if (document.getElementById('progress').classList.contains('active')) {
            updateCharts();
        }
    }
    
    function deleteTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        updateTransactions();
        updateSummary();
        
        // Update charts if on progress page
        if (document.getElementById('progress').classList.contains('active')) {
            updateCharts();
        }
    }
    
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    function updateTransactions() {
        // Clear existing transactions
        recentTransactionsEl.innerHTML = '';
        incomeHistoryEl.innerHTML = '';
        expenseHistoryEl.innerHTML = '';
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display recent transactions (last 5)
        const recentTransactions = sortedTransactions.slice(0, 5);
        recentTransactions.forEach(transaction => {
            recentTransactionsEl.appendChild(createTransactionElement(transaction));
        });
        
        // Display all income transactions
        const incomeTransactions = sortedTransactions.filter(t => t.type === 'income');
        incomeTransactions.forEach(transaction => {
            incomeHistoryEl.appendChild(createTransactionElement(transaction));
        });
        
        // Display all expense transactions
        const expenseTransactions = sortedTransactions.filter(t => t.type === 'expense');
        expenseTransactions.forEach(transaction => {
            expenseHistoryEl.appendChild(createTransactionElement(transaction));
        });
    }
    
    function createTransactionElement(transaction) {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        
        const isIncome = transaction.type === 'income';
        
        transactionEl.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-title">${transaction.category}</div>
                <div class="transaction-description">${transaction.description || 'No description'}</div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
            <div class="transaction-amount ${isIncome ? 'income-amount' : 'expense-amount'}">
                ${isIncome ? '+' : '-'}₹${transaction.amount.toFixed(2)}
            </div>
            <button class="delete-btn" data-id="${transaction.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Add delete event listener
        const deleteBtn = transactionEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteTransaction(id);
        });
        
        return transactionEl;
    }
    
    function updateSummary() {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = totalIncome - totalExpense;
        
        totalIncomeEl.textContent = `₹${totalIncome.toFixed(2)}`;
        totalExpenseEl.textContent = `₹${totalExpense.toFixed(2)}`;
        totalBalanceEl.textContent = `₹${balance.toFixed(2)}`;
    }
    
    function updateCharts() {
        // Destroy existing chart if it exists
        if (financeChart) {
            financeChart.destroy();
        }
        
        // Prepare data for charts
        const incomeByCategory = getTransactionsByCategory('income');
        const expenseByCategory = getTransactionsByCategory('expense');
        
        // Update category breakdown
        updateCategoryBreakdown(incomeByCategory, incomeSourcesEl, true);
        updateCategoryBreakdown(expenseByCategory, expenseCategoriesEl, false);
        
        // Create main chart
        const last6Months = getLast6Months();
        const incomeData = getMonthlyData('income', last6Months);
        const expenseData = getMonthlyData('expense', last6Months);
        
        const ctx = financeChartEl.getContext('2d');
        financeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last6Months.map(month => formatMonth(month)),
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expense',
                        data: expenseData,
                        backgroundColor: 'rgba(247, 37, 133, 0.7)',
                        borderColor: 'rgba(247, 37, 133, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Income vs Expense (Last 6 Months)',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
    
    function getTransactionsByCategory(type) {
        const categoryMap = {};
        
        transactions
            .filter(t => t.type === type)
            .forEach(t => {
                if (!categoryMap[t.category]) {
                    categoryMap[t.category] = 0;
                }
                categoryMap[t.category] += t.amount;
            });
        
        return Object.entries(categoryMap).map(([category, amount]) => ({
            category,
            amount
        }));
    }
    
    function updateCategoryBreakdown(categories, containerEl, isIncome) {
        containerEl.innerHTML = '';
        
        if (categories.length === 0) {
            containerEl.innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Sort by amount (descending)
        categories.sort((a, b) => b.amount - a.amount);
        
        // Generate random colors for categories
        const colors = generateColors(categories.length, isIncome);
        
        categories.forEach((item, index) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-item';
            
            categoryEl.innerHTML = `
                <div class="category-name">
                    <span class="category-color" style="background-color: ${colors[index]}"></span>
                    <span>${item.category}</span>
                </div>
                <div class="category-amount">₹${item.amount.toFixed(2)}</div>
            `;
            
            containerEl.appendChild(categoryEl);
        });
    }
    
    function generateColors(count, isIncome) {
        const colors = [];
        const baseHue = isIncome ? 190 : 340; // Blue for income, Pink for expense
        const saturation = 80;
        const lightness = 60;
        
        for (let i = 0; i < count; i++) {
            const hue = (baseHue + (i * 30)) % 360;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        
        return colors;
    }
    
    function getLast6Months() {
        const months = [];
        const date = new Date();
        
        for (let i = 0; i < 6; i++) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // 1-12
            months.unshift(`${year}-${month.toString().padStart(2, '0')}`);
            date.setMonth(date.getMonth() - 1);
        }
        
        return months;
    }
    
    function getMonthlyData(type, months) {
        return months.map(month => {
            return transactions
                .filter(t => t.type === type && t.date.startsWith(month))
                .reduce((sum, t) => sum + t.amount, 0);
        });
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function formatMonth(monthString) {
        const [year, month] = monthString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
});