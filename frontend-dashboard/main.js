const API_BASE = 'http://localhost:3000';

// DOM Elements
const totalTicketsEl = document.getElementById('totalTicketsEl');
const ticketListBody = document.getElementById('ticketListBody');
const bookTicketForm = document.getElementById('bookTicketForm');
const bookingStatus = document.getElementById('bookingStatus');
const submitBtn = bookTicketForm.querySelector('button[type="submit"]');
const refreshBtn = document.getElementById('refreshBtn');

// Initialize Dashboard
async function initDashboard() {
  await fetchStats();
  await fetchTickets();
}

// Fetch Stats from Backend
async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data = await res.json();
    animateValue(totalTicketsEl, 0, data.total, 1000);
  } catch (error) {
    console.error('Error fetching stats:', error);
    totalTicketsEl.textContent = 'Error';
  }
}

// Fetch Tickets from Backend
async function fetchTickets() {
  try {
    const res = await fetch(`${API_BASE}/tickets`);
    if (!res.ok) throw new Error('Failed to fetch tickets');
    const data = await res.json();
    renderTickets(data.data);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    ticketListBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Failed to load tickets. Is backend running?</td></tr>`;
  }
}

// Render Tickets Table
function renderTickets(tickets) {
  if (!tickets || tickets.length === 0) {
    ticketListBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No tickets booked yet.</td></tr>`;
    return;
  }

  ticketListBody.innerHTML = tickets.map(ticket => {
    const date = new Date(ticket.timestamp || Date.now()).toLocaleString();
    const id = ticket._id ? ticket._id.substring(0, 8) + '...' : 'PENDING';
    return `
      <tr>
        <td>${id}</td>
        <td><span class="badge">${ticket.userId}</span></td>
        <td><strong>${ticket.seatNumber}</strong></td>
        <td>${date}</td>
      </tr>
    `;
  }).join('');
}

// Book Ticket Form Submit
bookTicketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userId = document.getElementById('userId').value.trim();
  const seatNumber = document.getElementById('seatNumber').value.trim();
  
  if (!userId || !seatNumber) return;

  // Set loading state
  submitBtn.classList.add('button-loading');
  submitBtn.disabled = true;
  bookingStatus.className = 'status-msg hidden';

  try {
    const res = await fetch(`${API_BASE}/buy-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, seatNumber })
    });

    if (!res.ok) throw new Error('Failed to book ticket');
    
    // Show success
    showStatus('Ticket booked successfully! Please wait a moment for the background worker to process it.', 'success');
    bookTicketForm.reset();
    
    // Refresh Data after slight delay (allowing worker to save)
    setTimeout(() => {
      fetchStats();
      fetchTickets();
    }, 1500);

  } catch (error) {
    console.error('Booking error:', error);
    showStatus('Failed to book ticket. Ensure backend is running.', 'error');
  } finally {
    submitBtn.classList.remove('button-loading');
    submitBtn.disabled = false;
  }
});

// Refresh Button
refreshBtn.addEventListener('click', () => {
  // Add quick animation
  refreshBtn.style.transform = 'rotate(360deg)';
  setTimeout(() => refreshBtn.style.transform = 'none', 300);
  initDashboard();
});

// Utility: Animate Number Counter
function animateValue(obj, start, end, duration) {
  if (end === 0) { obj.innerHTML = 0; return; }
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Utility: Show Status Message
function showStatus(text, type) {
  bookingStatus.textContent = text;
  bookingStatus.className = `status-msg show ${type}`;
  setTimeout(() => {
    bookingStatus.className = 'status-msg hidden';
  }, 4000);
}

// Kickoff
initDashboard();
