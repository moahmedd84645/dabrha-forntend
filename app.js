// app.js

document.addEventListener('DOMContentLoaded', () => {
    // تعريف المتغيرات العامة وعناصر الواجهة (نفس السابق)
    const API_URL = 'https://dabarha.pythonanywhere.com/api';
        currentUser: null,
        transactions: [],
        editingTransactionId: null
    };

    const authScreen = document.getElementById('auth-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const balanceAmountEl = document.getElementById('balance-amount');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const transactionsListEl = document.getElementById('transactions-list');
    
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const logoutButton = document.getElementById('logout-button');
    
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const modalTitle = document.getElementById('modal-title');
    const typeExpenseBtn = document.getElementById('type-expense');
    const typeIncomeBtn = document.getElementById('type-income');
    const deleteBtn = document.getElementById('delete-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');


    const loader = document.getElementById('loader');
    const toast = document.getElementById('toast');

    // --- دوال مساعدة (نفس السابق) ---
    const showLoader = () => loader.classList.remove('hidden');
    const hideLoader = () => loader.classList.add('hidden');

    const showToast = (message, type = 'error') => {
        toast.textContent = message;
        toast.className = `show ${type}`;
        setTimeout(() => {
            toast.className = '';
        }, 3000);
    };

    // --- دوال الواجهة (UI) ---
    
    const showMainScreen = () => {
        authScreen.classList.remove('active');
        mainScreen.classList.add('active');
        authScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
    };

    const showAuthScreen = () => {
        mainScreen.classList.remove('active');
        authScreen.classList.add('active');
        mainScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
        loginForm.reset();
        registerForm.reset();
    };

    const updateSummary = () => {
        const totalIncome = state.transactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = state.transactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpenses;

        balanceAmountEl.textContent = `${balance.toFixed(2)} جنيه`;
        totalIncomeEl.textContent = totalIncome.toFixed(2);
        totalExpensesEl.textContent = totalExpenses.toFixed(2);
    };

    // **هنا التعديل الرئيسي لاستخدام الأيقونات**
    const renderTransactions = () => {
        transactionsListEl.innerHTML = '';
        if (state.transactions.length === 0) {
            transactionsListEl.innerHTML = '<p style="text-align:center; color:#888;">لا توجد عمليات لعرضها.</p>';
            return;
        }

        state.transactions.slice(0, 5).forEach(t => {
            const isIncome = t.transaction_type === 'income';
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.dataset.id = t.id;
            item.innerHTML = `
                <div class="transaction-icon ${isIncome ? 'income' : 'expense'}">
                    <i class="fa-solid ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="transaction-info">
                    <p class="transaction-category">${t.category}</p>
                    <p class="transaction-notes">${t.notes || ''}</p>
                </div>
                <span class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : '-'}${t.amount.toFixed(2)}
                </span>
            `;
            transactionsListEl.appendChild(item);
        });
    };
    
    const openTransactionModal = (transaction = null) => {
        transactionForm.reset();
        state.editingTransactionId = transaction ? transaction.id : null;

        if (transaction) {
            modalTitle.textContent = 'تعديل العملية';
            document.getElementById('transaction-id').value = transaction.id;
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('category').value = transaction.category;
            document.getElementById('notes').value = transaction.notes;
            if (transaction.transaction_type === 'income') {
                typeIncomeBtn.classList.add('active');
                typeExpenseBtn.classList.remove('active');
            } else {
                typeExpenseBtn.classList.add('active');
                typeIncomeBtn.classList.remove('active');
            }
            deleteBtn.classList.remove('hidden');
        } else {
            modalTitle.textContent = 'إضافة عملية جديدة';
            typeExpenseBtn.classList.add('active');
            typeIncomeBtn.classList.remove('active');
            deleteBtn.classList.add('hidden');
        }
        transactionModal.classList.remove('hidden');
    };

    const closeTransactionModal = () => {
        transactionModal.classList.add('hidden');
    };

    // --- دوال التعامل مع الـ API (نفس السابق) ---
    const fetchTransactions = async () => {
        if (!state.currentUser) return;
        showLoader();
        try {
            const response = await fetch(`${API_URL}/transactions?user_id=${state.currentUser.id}`);
            if (!response.ok) throw new Error('فشل في جلب البيانات');
            state.transactions = await response.json();
            updateSummary();
            renderTransactions();
        } catch (error) {
            showToast(error.message || 'حدث خطأ ما');
        } finally {
            hideLoader();
        }
    };
    
    // --- منطق التطبيق وأحداث المستخدم ---
    
    const checkLoginStatus = () => {
        const userId = localStorage.getItem('dabarha_user_id');
        const userEmail = localStorage.getItem('dabarha_user_email');
        if (userId && userEmail) {
            state.currentUser = { id: parseInt(userId), email: userEmail };
            showMainScreen();
            fetchTransactions();
        } else {
            showAuthScreen();
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
            
            state.currentUser = { id: data.user_id, email: data.email };
            localStorage.setItem('dabarha_user_id', data.user_id);
            localStorage.setItem('dabarha_user_email', data.email);
            
            showMainScreen();
            await fetchTransactions();
        } catch (error) {
            showToast(error.message);
        } finally {
            hideLoader();
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('register-email').value,
                    password: document.getElementById('register-password').value,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'فشل إنشاء الحساب');
            
            showToast('تم إنشاء الحساب بنجاح! قم بتسجيل الدخول.', 'success');
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');

        } catch (error) {
            showToast(error.message);
        } finally {
            hideLoader();
        }
    });

    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoader();

        const transactionData = {
            user_id: state.currentUser.id,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            notes: document.getElementById('notes').value,
            transaction_type: typeIncomeBtn.classList.contains('active') ? 'income' : 'expense',
        };

        try {
            // ... (نفس كود الحفظ والتعديل السابق)
            let response;
            if (state.editingTransactionId) {
                response = await fetch(`${API_URL}/transactions/${state.editingTransactionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
            } else {
                response = await fetch(`${API_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
            }
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'فشل حفظ العملية');
            await fetchTransactions();
            closeTransactionModal();
            showToast('تم حفظ العملية بنجاح!', 'success');
        } catch (error) {
            showToast(error.message);
        } finally {
            hideLoader();
        }
    });
    
    transactionsListEl.addEventListener('click', (e) => {
        const item = e.target.closest('.transaction-item');
        if (item) {
            const transactionId = parseInt(item.dataset.id);
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (transaction) {
                openTransactionModal(transaction);
            }
        }
    });
    
    logoutButton.addEventListener('click', () => {
        state.currentUser = null;
        localStorage.removeItem('dabarha_user_id');
        localStorage.removeItem('dabarha_user_email');
        showAuthScreen();
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
    
    addTransactionBtn.addEventListener('click', () => openTransactionModal());
    cancelBtn.addEventListener('click', closeTransactionModal);
    closeModalBtn.addEventListener('click', closeTransactionModal); // زر الإغلاق الجديد
    
    typeIncomeBtn.addEventListener('click', () => {
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
    });
    typeExpenseBtn.addEventListener('click', () => {
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
    });
    
    deleteBtn.addEventListener('click', async () => {
       if (state.editingTransactionId && confirm('هل أنت متأكد من حذف هذه العملية؟')) {
           showLoader();
           try {
                const response = await fetch(`${API_URL}/transactions/${state.editingTransactionId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('فشل الحذف');
                await fetchTransactions();
                closeTransactionModal();
                showToast('تم الحذف بنجاح', 'success');
           } catch (error) {
               showToast(error.message);
           } finally {
               hideLoader();
           }
       }
    });

    checkLoginStatus();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('Service Worker مسجل:', reg))
                .catch(err => console.log('فشل تسجيل Service Worker:', err));
        });
    }
});