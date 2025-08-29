/***************
 * STATE
 ***************/
let account = { bank: "", currency: "CAD", balance: 0, savings: 0, userName: "" };
let incomes = [];
let expenses = [];
let owings = [];
let upcomingPayments = [];
let history = {};
let chatHistory = JSON.parse(localStorage.getItem("budgetChatHistory")) || [];

const balanceWarningInput = document.getElementById("balanceWarningThreshold");
const saveThresholdBtn = document.getElementById("saveThresholdBtn");

// Load saved threshold into input on page load
document.addEventListener("DOMContentLoaded", () => {
  if (account.balanceWarning) balanceWarningInput.value = account.balanceWarning;
});

// Save threshold when button is clicked
saveThresholdBtn.addEventListener("click", () => {
  const val = parseFloat(balanceWarningInput.value);
  if (isNaN(val) || val < 0) return alert("Enter a valid amount");
  account.balanceWarning = val;
  localStorage.setItem("budgetAccount", JSON.stringify(account));
  alert(`Balance warning set to ${account.currency} ${val}`);
  updateDashboard();
});

/***************
 * LOAD FROM STORAGE (state only)
 ***************/
if (localStorage.getItem("budgetAccount")) account = JSON.parse(localStorage.getItem("budgetAccount"));
if (localStorage.getItem("budgetIncomes")) incomes = JSON.parse(localStorage.getItem("budgetIncomes"));
if (localStorage.getItem("budgetExpenses")) expenses = JSON.parse(localStorage.getItem("budgetExpenses"));
if (localStorage.getItem("budgetOwings")) owings = JSON.parse(localStorage.getItem("budgetOwings"));
if (localStorage.getItem("budgetUpcoming")) upcomingPayments = JSON.parse(localStorage.getItem("budgetUpcoming"));
if (localStorage.getItem("budgetHistory")) history = JSON.parse(localStorage.getItem("budgetHistory"));


/***************
 * PASSWORD PROTECTION
 ***************/
const PASSWORD = "CODEWITHSATELLITE";
const EXPIRY_MINUTES = 30;

const passwordOverlay = document.getElementById("passwordOverlay");
const sitePasswordInput = document.getElementById("sitePassword");
const submitPasswordBtn = document.getElementById("submitPassword");
const passwordError = document.getElementById("passwordError");

function isSessionValid() {
  const lastLogin = localStorage.getItem("lastLoginTime");
  if (!lastLogin) return false;

  const diff = (Date.now() - parseInt(lastLogin)) / (1000 * 60); // minutes
  return diff < EXPIRY_MINUTES;
}

function requirePassword() {
  if (isSessionValid()) {
    passwordOverlay.style.display = "none";
    return;
  }
  passwordOverlay.style.display = "flex";
}

submitPasswordBtn.addEventListener("click", () => {
  if (sitePasswordInput.value === PASSWORD) {
    localStorage.setItem("lastLoginTime", Date.now().toString());
    passwordOverlay.style.display = "none";
    passwordError.style.display = "none";
    sitePasswordInput.value = "";
  } else {
    passwordError.style.display = "block";
    sitePasswordInput.value = "";
  }
});

// Enter key support
sitePasswordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") submitPasswordBtn.click();
});

// Run on load
document.addEventListener("DOMContentLoaded", requirePassword);


/***************
 * REST OF YOUR JS FILE STARTS HERE
 ***************/
document.addEventListener("DOMContentLoaded", () => {
  renderUserName();
  updateDashboard();
  renderHistory();
  renderChatbotHistory();
});

/***************
 * DOM
 ***************/
const userNameDisplay = document.getElementById("userNameDisplay");
const userNameInput   = document.getElementById("userName");

const bankSelect = document.getElementById("bankSelect");
const bankOtherLabel = document.getElementById("bankOtherLabel");
const bankOtherText = document.getElementById("bankOtherText");
const currencySelect = document.getElementById("currencySelect");
const startingBalanceInput = document.getElementById("startingBalance");
const startingSavingsInput = document.getElementById("startingSavings");
const setupForm = document.getElementById("setupForm");

const displayBank = document.getElementById("displayBank");
const displayCurrency = document.getElementById("displayCurrency");
const displayBalance = document.getElementById("displayBalance");
const displaySavings = document.getElementById("displaySavings");
const displayTotalIncome = document.getElementById("displayTotalIncome");
const displayTotalExpenses = document.getElementById("displayTotalExpenses");
const displayOwingMe = document.getElementById("displayOwingMe");
const displayOwingOthers = document.getElementById("displayOwingOthers");
const displayUpcomingTotal = document.getElementById("displayUpcomingTotal");
const displayNet = document.getElementById("displayNet");

const incomeDesc = document.getElementById("incomeDesc");
const incomeAmount = document.getElementById("incomeAmount");
const addIncomeBtn = document.getElementById("addIncomeBtn");
const incomeList = document.getElementById("incomeList");

const expenseDesc = document.getElementById("expenseDesc");
const expenseCategory = document.getElementById("expenseCategory");
const expenseAmount = document.getElementById("expenseAmount");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const expenseList = document.getElementById("expenseList");

const owingName = document.getElementById("owingName");
const owingAmount = document.getElementById("owingAmount");
const owingType = document.getElementById("owingType");
const addOwingBtn = document.getElementById("addOwingBtn");
const owingList = document.getElementById("owingList");

const upcomingDesc = document.getElementById("upcomingDesc");
const upcomingAmount = document.getElementById("upcomingAmount");
const upcomingDate = document.getElementById("upcomingDate");
const addUpcomingBtn = document.getElementById("addUpcomingBtn");
const upcomingList = document.getElementById("upcomingList");

const historyList = document.getElementById("historyList");
const historyDateInput = document.getElementById("historyDateInput");
const viewHistoryBtn = document.getElementById("viewHistoryBtn");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");

const deleteAllBtn = document.getElementById("deleteAllBtn");

// Modal elements
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModal");
const modalBody = document.getElementById("modalBody");

/***************
 * HELPERS
 ***************/
function renderUserName() {
  userNameDisplay.textContent = account.userName ? `Hello, ${account.userName}!` : "";
}

bankSelect.addEventListener("change", () => {
  bankOtherLabel.style.display = bankSelect.value === "Other" ? "inline-block" : "none";
});

/***************
 * SETUP FORM SAVE
 ***************/
setupForm.addEventListener("submit", e => {
  e.preventDefault();

  const nameVal = userNameInput.value.trim();
  if (nameVal !== "") account.userName = nameVal;

  account.bank = bankSelect.value === "Other" ? bankOtherText.value.trim() : bankSelect.value;
  account.currency = currencySelect.value;

  const balVal = startingBalanceInput.value.trim();
  if (balVal !== "") account.balance = parseFloat(balVal) || 0;

  const savVal = startingSavingsInput.value.trim();
  if (savVal !== "") account.savings = parseFloat(savVal) || 0;

  localStorage.setItem("budgetAccount", JSON.stringify(account));

  renderUserName();
  updateDashboard();
  alert("Account saved!");

  setupForm.reset();
  bankOtherLabel.style.display = "none";
});

/***************
 * HISTORY SNAPSHOT
 ***************/
function saveDailySnapshot() {
    const today = new Date().toISOString().split('T')[0];
    // Save snapshot only if it doesn't exist for today
    if (!history[today]) {
      history[today] = {
        balance: account.balance,
        savings: account.savings,
        incomes: [...incomes],
        expenses: [...expenses],
        owings: [...owings],
        upcomingPayments: [...upcomingPayments]
      };
      localStorage.setItem('budgetHistory', JSON.stringify(history));
    }
  }
  
  function renderHistory(date = null) {
    historyList.innerHTML = "";
    if (!date) return; // Do nothing if no date is specified
  
    if (!history[date]) {
      historyList.innerHTML = "<p>No records found for this date.</p>";
      return;
    }
  
    const snap = history[date];
    const div = document.createElement("div");
    div.classList.add("historyCard");
  
    const totalIncome = snap.incomes.reduce((sum,i)=>sum+i.amount,0);
    const totalExpenses = snap.expenses.reduce((sum,e)=>sum+e.amount,0);
    const owedToMe = snap.owings.filter(o=>o.type==="they-owe-me").reduce((sum,o)=>sum+o.amount,0);
    const iOwe = snap.owings.filter(o=>o.type==="i-owe").reduce((sum,o)=>sum+o.amount,0);
    const upcoming = snap.upcomingPayments.reduce((sum,p)=>sum+p.amount,0);
  
    const incomeDetails = snap.incomes.map(i=>`${i.desc} - ${account.currency} ${i.amount.toFixed(2)}`).join("<br>") || "-";
    const expenseDetails = snap.expenses.map(e=>`${e.cat || "Expense"}: ${e.desc} - ${account.currency} ${e.amount.toFixed(2)}`).join("<br>") || "-";
    const owingDetails = snap.owings.map(o=>`${o.type==="i-owe"?"I owe":"Owed to me"} ${o.name} - ${account.currency} ${o.amount.toFixed(2)}`).join("<br>") || "-";
    const upcomingDetails = snap.upcomingPayments.map(p=>`${p.desc} - ${account.currency} ${p.amount.toFixed(2)} (Due: ${p.date})`).join("<br>") || "-";
  
    const netBalance = (snap.balance || 0) + (snap.savings || 0) + owedToMe - iOwe - upcoming;
  
    div.innerHTML = `<strong>${date}</strong><br>
      <strong>Checking Account Balance:</strong> ${account.currency} ${(snap.balance || 0).toFixed(2)}<br>
      <strong>Savings:</strong> ${account.currency} ${(snap.savings || 0).toFixed(2)}<br>
      <strong>Net Balance:</strong> ${account.currency} ${netBalance.toFixed(2)}<br>
      <u>Income:</u><br>${incomeDetails}<br>
      <u>Expenses:</u><br>${expenseDetails}<br>
      <u>Owings:</u><br>${owingDetails}<br>
      <u>Upcoming Payments:</u><br>${upcomingDetails}`;
  
    historyList.appendChild(div);
  }
  
  viewHistoryBtn.addEventListener("click", ()=>{
    const date = historyDateInput.value;
    if(!date) return alert("Pick a date");
  
    // Save snapshot for today only if the selected date is today
    if (date === new Date().toISOString().split('T')[0]) saveDailySnapshot();
  
    renderHistory(date);
    closeHistoryBtn.style.display = "inline-block";
  });
  
  closeHistoryBtn.addEventListener("click", ()=>{
    historyList.innerHTML = "";
    historyDateInput.value = "";
    closeHistoryBtn.style.display = "none";
  });
/***************
 * RENDER LISTS + REMOVE
 ***************/
function renderList(listElement, list, removeFn) {
    listElement.innerHTML = "";
    list.forEach((item,i)=>{
      const li = document.createElement("li");
      const dateText = item.date ? ` (Due: ${item.date})` : "";
      li.innerHTML = `<span>${item.desc || item.name} - ${account.currency} ${item.amount.toFixed(2)}${dateText}</span>
                      <button class="removeBtn">X</button>`;
      li.querySelector("button").addEventListener("click", ()=>removeFn(i));
      listElement.appendChild(li);
    });
  }
  
  function renderOwingList() {
    owingList.innerHTML = "";
    owings.forEach((o,i)=>{
      const li = document.createElement("li");
      li.innerHTML = `<span>${o.type==="i-owe"?"I owe":"Owed to me"} ${o.name} - ${account.currency} ${o.amount.toFixed(2)}</span>
                      <button class="removeBtn">X</button>`;
      li.querySelector("button").addEventListener("click", ()=>removeOwing(i));
      owingList.appendChild(li);
    });
  }
  
  function renderUpcomingList() {
    upcomingList.innerHTML = "";
    upcomingPayments.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${p.desc} - ${account.currency} ${p.amount.toFixed(2)} (Due: ${p.date})</span>
                      <button class="removeBtn">X</button>`;
      li.querySelector("button").addEventListener("click", ()=>removeUpcoming(i));
      upcomingList.appendChild(li);
    });
  }
  
  function removeIncome(i){
    account.balance -= incomes[i].amount;
    incomes.splice(i,1);
    localStorage.setItem("budgetIncomes", JSON.stringify(incomes));
    localStorage.setItem("budgetAccount", JSON.stringify(account));
    updateDashboard();
  }
  
  function removeExpense(i){
    account.balance += expenses[i].amount;
    expenses.splice(i,1);
    localStorage.setItem("budgetExpenses", JSON.stringify(expenses));
    localStorage.setItem("budgetAccount", JSON.stringify(account));
    updateDashboard();
  }
  
  function removeOwing(i){ 
    owings.splice(i,1); 
    localStorage.setItem("budgetOwings", JSON.stringify(owings)); 
    updateDashboard(); 
  }
  
  function removeUpcoming(i){ 
    upcomingPayments.splice(i,1); 
    localStorage.setItem("budgetUpcoming", JSON.stringify(upcomingPayments)); 
    updateDashboard(); 
  }
  
  /***************
   * DASHBOARD
   ***************/
  function updateDashboard() {
    displayBank.textContent = account.bank || "-";
    displayCurrency.textContent = account.currency;
    const threshold = account.balanceWarning ?? 500; // fallback default
    const balanceSymbol = account.balance < threshold ? " ⚠️" : "";
    displayBalance.textContent = account.balance.toFixed(2) + balanceSymbol;
    displaySavings.textContent = account.savings.toFixed(2);
  
    const totalIncome = incomes.reduce((sum,i)=>sum+i.amount,0);
    const totalExpenses = expenses.reduce((sum,e)=>sum+e.amount,0);
    const owingMe = owings.filter(o=>o.type==="they-owe-me").reduce((sum,o)=>sum+o.amount,0);
    const owingOthers = owings.filter(o=>o.type==="i-owe").reduce((sum,o)=>sum+o.amount,0);
    const upcoming = upcomingPayments.reduce((sum,p)=>sum+p.amount,0);
  
    displayTotalIncome.textContent = totalIncome.toFixed(2);
    displayTotalExpenses.textContent = totalExpenses.toFixed(2);
    displayOwingMe.textContent = owingMe.toFixed(2);
    displayOwingOthers.textContent = owingOthers.toFixed(2);
    displayUpcomingTotal.textContent = upcoming.toFixed(2);

    if(owingOthers > 0){
        displayOwingOthers.textContent += " ⚠️";
    }
    
    if(upcoming > 0){
        displayUpcomingTotal.textContent += " 📅";
    }
  
    const net = account.balance + account.savings + owingMe - owingOthers - upcoming;
    displayNet.textContent = net.toFixed(2);
  
    renderList(incomeList, incomes, removeIncome);
    renderList(expenseList, expenses, removeExpense);
    renderOwingList();
    renderUpcomingList();
  
    document.querySelector(".owetome").addEventListener("click", ()=>showModal("Owed To Me", owings.filter(o=>o.type==="they-owe-me")));
    document.querySelector(".owebyme").addEventListener("click", ()=>showModal("I Owe", owings.filter(o=>o.type==="i-owe")));
    document.querySelector(".upcoming-payments").addEventListener("click", ()=>showModal("Upcoming Payments", upcomingPayments));
  
    saveDailySnapshot();
    renderHistory();
  }
  
  /***************
   * DASHBOARD CLICKABLE CARDS
   ***************/
  function setupDashboardClicks() {
   const owedToMeCard = document.querySelector(".owetome");
   const iOweCard = document.querySelector(".owebyme");
   const upcomingCard = document.querySelector(".upcoming-payments");
  
   owedToMeCard.addEventListener("click", () => {
     showModal("Owed To Me", owings.filter(o => o.type === "they-owe-me"));
   });
  
   iOweCard.addEventListener("click", () => {
     showModal("I Owe", owings.filter(o => o.type === "i-owe"));
   });
  
   upcomingCard.addEventListener("click", () => {
     showModal("Upcoming Payments", upcomingPayments);
   });
  }
  
  /***************
  * MODAL
  ***************/
  function showModal(title, items) {
   modalBody.innerHTML = "";
  
   const h3 = document.createElement("h3");
   h3.textContent = title;
   modalBody.appendChild(h3);
  
   if (!items || items.length === 0) {
     const empty = document.createElement("div");
     empty.textContent = "No records.";
     modalBody.appendChild(empty);
   } else {
     items.forEach(item => {
       const div = document.createElement("div");
       if (item.name) {
         div.textContent = `${item.type === "i-owe" ? "I owe" : "Owed to me"} ${item.name} - ${account.currency} ${item.amount.toFixed(2)}`;
       } else {
         const dateText = item.date ? ` (Due: ${item.date})` : "";
         div.textContent = `${item.desc} - ${account.currency} ${item.amount.toFixed(2)}${dateText}`;
       }
       modalBody.appendChild(div);
     });
   }
  
   modalOverlay.style.display = "flex";
  }
  
  // Close modal
  closeModalBtn.addEventListener("click", () => {
   modalOverlay.style.display = "none";
   modalBody.innerHTML = "";
  });
  
  // Optional: click outside modal content to close
  modalOverlay.addEventListener("click", (e) => {
   if (e.target === modalOverlay) {
     modalOverlay.style.display = "none";
     modalBody.innerHTML = "";
   }
  });
  
  setupDashboardClicks();
  
  /***************
   * ADD ITEMS
   ***************/
  addIncomeBtn.addEventListener("click", ()=>{
    const desc = incomeDesc.value.trim();
    const amount = parseFloat(incomeAmount.value);
    if(!desc || isNaN(amount)) return alert("Enter valid income");
    incomes.push({desc, amount});
    account.balance += amount;
    localStorage.setItem("budgetIncomes", JSON.stringify(incomes));
    localStorage.setItem("budgetAccount", JSON.stringify(account));
    updateDashboard();
    incomeDesc.value=""; incomeAmount.value="";
  });
  
  addExpenseBtn.addEventListener("click", ()=>{
    const desc = expenseDesc.value.trim();
    const cat = expenseCategory.value.trim();
    const amount = parseFloat(expenseAmount.value);
    if(!desc || isNaN(amount)) return alert("Enter valid expense");
    expenses.push({desc, cat, amount});
    account.balance -= amount;
    localStorage.setItem("budgetExpenses", JSON.stringify(expenses));
    localStorage.setItem("budgetAccount", JSON.stringify(account));
    updateDashboard();
    expenseDesc.value=""; expenseCategory.value=""; expenseAmount.value="";
  });
  
  addOwingBtn.addEventListener("click", ()=>{
    const name = owingName.value.trim();
    const amount = parseFloat(owingAmount.value);
    const type = owingType.value;
    if(!name || isNaN(amount)) return alert("Enter valid owing");
    owings.push({name, amount, type});
    localStorage.setItem("budgetOwings", JSON.stringify(owings));
    updateDashboard();
    owingName.value=""; owingAmount.value=""; owingType.value="they-owe-me";
  });
  
  addUpcomingBtn.addEventListener("click", ()=>{
    const desc = upcomingDesc.value.trim();
    const amount = parseFloat(upcomingAmount.value);
    const date = upcomingDate.value || new Date().toISOString().split("T")[0];
    if(!desc || isNaN(amount)) return alert("Enter valid upcoming payment");
    upcomingPayments.push({desc, amount, date});
    localStorage.setItem("budgetUpcoming", JSON.stringify(upcomingPayments));
    updateDashboard();
    upcomingDesc.value=""; upcomingAmount.value=""; upcomingDate.value="";
  });

/***************
 * DELETE ALL
 ***************/
if(deleteAllBtn){
    deleteAllBtn.addEventListener("click", ()=>{
      if(confirm("Are you sure you want to delete all data? This cannot be undone.")){
        localStorage.clear();
  
        // Reset account and threshold
        account = { bank: "", currency: "CAD", balance: 0, savings: 0, userName: "", balanceWarning: undefined };
        
        incomes = [];
        expenses = [];
        owings = [];
        upcomingPayments = [];
        history = {};
        chatHistory = [];
  
        // Clear input field for threshold
        const balanceWarningInput = document.getElementById("balanceWarningThreshold");
        if(balanceWarningInput) balanceWarningInput.value = "";
  
        renderUserName();
        updateDashboard();
        alert("All data deleted!");
      }
    });
  }

/***************
 * INITIALIZE
 ***************/
document.addEventListener("DOMContentLoaded", () => {
  renderUserName();
  updateDashboard();
});

/***************
 * CHATBOT
 ***************/
let chatbotHistory = [];
const guidanceTemplate = "Ask me about your current balance, who owes you, your expenses, upcoming payments, or get spending tips.";
const moneyTips = [
  "Track your expenses daily to stay in control of your money.",
  "Always save at least 10% of your income.",
  "Avoid impulse purchases; plan your spending.",
  "Review your budget weekly for better control.",
  "Pay off high-interest debts first.",
  "Keep an emergency fund for unexpected expenses.",
  "Set financial goals for the short and long term.",
  "Use cash envelopes for discretionary spending.",
  "Check your bank statements regularly for errors.",
  "Invest regularly, even small amounts.",
  "Avoid unnecessary subscriptions you don’t use.",
  "Compare prices before making major purchases.",
  "Prioritize needs over wants.",
  "Automate savings to ensure consistency.",
  "Keep track of who owes you and who you owe.",
  "Review your credit score periodically.",
  "Limit dining out to save more money.",
  "Sell unused items for extra cash.",
  "Plan for large purchases to avoid debt.",
  "Always have a clear financial plan for the month."
];

// Popup (dynamic)
const chatPopup = document.createElement("div");
chatPopup.id = "chatPopup";
Object.assign(chatPopup.style, {
  display:"none", flexDirection:"column", position:"fixed",
  bottom:"80px", right:"20px", width:"320px", background:"#fff",
  border:"1px solid #ccc", borderRadius:"8px", boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
  zIndex:"1001", fontFamily:"Arial, sans-serif", padding:"5px", maxHeight:"400px"
});

// Header
const chatHeader = document.createElement("div");
chatHeader.id = "chatHeader";
Object.assign(chatHeader.style, {
  background:"#27ae60", color:"#fff", padding:"5px 10px",
  borderRadius:"6px 6px 0 0", fontWeight:"bold", display:"flex",
  justifyContent:"space-between", alignItems:"center"
});
chatHeader.innerHTML = `<span>💬 Chat</span><span id="closeChat" style="cursor:pointer;">✖</span>`;
chatPopup.appendChild(chatHeader);

// Tip + guidance
const tipContainer = document.createElement("div");
tipContainer.id = "tipContainer";
Object.assign(tipContainer.style, {
  display:"flex", flexDirection:"column", background:"#f1c40f", color:"#2c3e50",
  padding:"5px 10px", borderRadius:"5px", margin:"5px 0", fontSize:"0.9rem", textAlign:"center"
});
const guidanceText = document.createElement("div");
guidanceText.textContent = guidanceTemplate;
guidanceText.style.fontWeight = "bold";
guidanceText.style.marginBottom = "5px";
const tipText = document.createElement("div");
tipText.id = "tipText";
tipContainer.appendChild(guidanceText);
tipContainer.appendChild(tipText);
chatPopup.appendChild(tipContainer);

// Messages
const chatMessages = document.createElement("div");
chatMessages.id = "chatMessages";
Object.assign(chatMessages.style, { flex:"1", overflowY:"auto", height:"200px", padding:"5px" });
chatPopup.appendChild(chatMessages);

// Controls
const chatControls = document.createElement("div");
chatControls.id = "chatControls";
Object.assign(chatControls.style, { display:"flex", marginTop:"5px" });
const chatInput = document.createElement("input");
chatInput.id = "chatInput";
chatInput.placeholder = "Type a message...";
Object.assign(chatInput.style, { flex:"1", padding:"5px" });
const sendChat = document.createElement("button");
sendChat.id = "sendChat";
sendChat.textContent = "Send";
Object.assign(sendChat.style, {
  padding:"5px 8px", marginLeft:"5px", background:"#27ae60",
  color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer"
});
chatControls.appendChild(chatInput);
chatControls.appendChild(sendChat);
chatPopup.appendChild(chatControls);
document.body.appendChild(chatPopup);

// Open/Close
const openChatBtn = document.getElementById("openChatBtn");
const closeChat = chatHeader.querySelector("#closeChat");

if (openChatBtn) {
  openChatBtn.addEventListener("click", () => {
    chatPopup.style.display = "flex";
    openChatBtn.style.display = "none";
    chatbotHistory = [];
    chatMessages.innerHTML = "";
    tipText.textContent = moneyTips[Math.floor(Math.random() * moneyTips.length)];
  });
}

closeChat.addEventListener("click", () => {
  chatPopup.style.display = "none";
  if (openChatBtn) openChatBtn.style.display = "block";
  chatbotHistory = [];
  chatMessages.innerHTML = "";
  tipText.textContent = "";
});

// Chat render
function renderChatbotHistory() {
  chatMessages.innerHTML = "";
  chatbotHistory.forEach(msg => {
    const div = document.createElement("div");
    div.textContent = msg.text;
    div.className = msg.type;
    Object.assign(div.style, {
      margin:"3px 0", padding:"5px 8px", borderRadius:"12px",
      maxWidth:"80%", wordBreak:"break-word",
      alignSelf: msg.type === "bot" ? "flex-start" : "flex-end",
      background: msg.type === "bot" ? "#bdc3c7" : "#27ae60",
      color: msg.type === "bot" ? "#2c3e50" : "#fff"
    });
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addChatbotMessage(text, type = "user") {
  chatbotHistory.push({ text, type });
  renderChatbotHistory();
}

// Chat logic
sendChat.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  addChatbotMessage(msg, "user");
  chatInput.value = "";

  setTimeout(() => {
    let response = "I’m here to help with your finances!";
    const t = msg.toLowerCase();

    if (t.includes("balance")) {
      response = `Your current balance is ${account.currency} ${account.balance.toFixed(2)}.`;
    } else if (t.includes("owed to me") || t.includes("who owes me") || t.includes("they owe")) {
      const total = owings.filter(o => o.type === "they-owe-me").reduce((s, o) => s + o.amount, 0);
      response = `Total owed to you: ${account.currency} ${total.toFixed(2)}.`;
    } else if (t.includes("i owe") || t.includes("owe others")) {
      const total = owings.filter(o => o.type === "i-owe").reduce((s, o) => s + o.amount, 0);
      response = `Total you owe others: ${account.currency} ${total.toFixed(2)}.`;
    } else if (t.includes("upcoming")) {
      const total = upcomingPayments.reduce((s, p) => s + p.amount, 0);
      response = `Total upcoming payments: ${account.currency} ${total.toFixed(2)}.`;
    } else if (t.includes("spend today")) {
      const dailyBudget = Math.max(account.balance * 0.2, 0);
      response = `You can spend up to ${account.currency} ${dailyBudget.toFixed(2)} today safely.`;
    } else if (t.includes("saving tip") || t.includes("advice")) {
      response = moneyTips[Math.floor(Math.random() * moneyTips.length)];
    }

    addChatbotMessage(response, "bot");
  }, 400);
});

chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendChat.click();
});

/***************
 * INITIALIZE
 ***************/
renderUserName();
updateDashboard();
renderHistory();
renderChatbotHistory();