import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { dropService, reservationService, purchaseService } from './services/api';
import DropCard from './components/DropCard';
import OrderHistory from './components/OrderHistory';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

const PulseDot = ({ color = '#ff1744' }) => (
    <span className="app-pulse-dot" style={{ background: color }} />
);

export default function App() {
  const [drops, setDrops] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authView, setAuthView] = useState('login');
  const [currentReservation, setCurrentReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState({});
  const [loadingPurchases, setLoadingPurchases] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [purchases, setPurchases] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [dropForm, setDropForm] = useState({ name: '', price: '', stock: '' });
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);
  const socketRef = useRef(null);

  const addNotification = useCallback((message, variant = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, variant }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await dropService.getDrops();
      setDrops(data);
    } catch (err) {
      addNotification('Failed to load drops', 'danger');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [addNotification]);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    try {
      const data = await purchaseService.getUserPurchases(user.id);
      setPurchases(data);
    } catch (err) {
      addNotification('Failed to load purchase history', 'danger');
    }
  }, [addNotification, user]);

  const loadAllPurchases = useCallback(async () => {
    try {
      const data = await purchaseService.getAllPurchases();
      setAllPurchases(data);
    } catch (err) {
      addNotification('Failed to load system orders', 'danger');
    }
  }, [addNotification]);

  useEffect(() => {
    loadData();
    if (activeTab === 'history' && user) {
      loadPurchases();
      loadAllPurchases();
    }
  }, [user, activeTab, loadData, loadPurchases, loadAllPurchases]);

  useEffect(() => {
    const apiBase = process.env.REACT_APP_API_BASE || 
      (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);
    const socketUrl = (process.env.REACT_APP_SOCKET_URL || apiBase).replace(/\/api\/?$/, '');
    
    const socket = io(socketUrl, { 
      path: '/socket.io/',
      transports: ['polling', 'websocket'] 
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('socket connected', socket.id);
    });

    socket.on('stockUpdated', ({ dropId, availableStock }) => {
      setDrops(prev => prev.map(d => d.id === dropId ? { ...d, availableStock } : d));
    });

    socket.on('dropCreated', (newDrop) => {
      setDrops(prev => [newDrop, ...prev]);
      addNotification(`New drop alert: ${newDrop.name}!`, 'info');
    });

    socket.on('purchaseMade', ({ dropId, userId, username }) => {
      addNotification(`User ${username || userId} purchased item`, 'info');
      // Update the drop's recent purchasers if it's currently in the list
      setDrops(prev => prev.map(d => {
        if (d.id === dropId) {
          const newPurchases = [{ User: { user: username || userId } }, ...(d.Purchases || [])].slice(0, 3);
          return { ...d, Purchases: newPurchases };
        }
        return d;
      }));
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected');
    });

    // Fallback polling for serverless environments (e.g. Vercel) where WebSockets may be intermittent
    const pollInterval = setInterval(() => loadData(false), 30000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [addNotification, loadData]);

  // Separate effect for reservation expiration to avoid socket reconnection when user changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleExpiration = ({ dropId, userId }) => {
      if (user && userId === user.id) {
        setCurrentReservation(null);
        addNotification('Your reservation expired', 'warning');
      }
    };

    socket.on('reservationExpired', handleExpiration);
    return () => {
      socket.off('reservationExpired', handleExpiration);
    };
  }, [user, addNotification]);

  const handleAuth = (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    addNotification(`Welcome, ${userData.fullName || userData.user}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    addNotification('Logged out successfully', 'info');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const handleCreateDrop = async (e) => {
    e.preventDefault();
    if (!dropForm.name || !dropForm.price || !dropForm.stock) return;
    try {
      setIsCreatingDrop(true);
      await dropService.createDrop({
        name: dropForm.name,
        price: parseFloat(dropForm.price),
        totalStock: parseInt(dropForm.stock)
      });
      addNotification('New drop initialized!', 'success');
      setDropForm({ name: '', price: '', stock: '' });
      loadData(false);
    } catch (err) {
      addNotification('Failed to create drop', 'danger');
    } finally {
      setIsCreatingDrop(false);
    }
  };

  const handleReserve = async (dropId) => {
    if (currentReservation) { addNotification('You already have a reservation', 'warning'); return; }
    try {
      setLoadingReservations(prev => ({ ...prev, [dropId]: true }));
      const res = await reservationService.reserveItem(user.id, dropId);
      setCurrentReservation({ id: res.reservation.id, dropId: res.reservation.dropId, expiresAt: res.reservation.expiresAt });
      addNotification('Item reserved for 60 seconds!', 'success');
      loadData(false);
    } catch (err) {
      addNotification(err.response?.data?.error || 'Reservation failed', 'danger');
    } finally {
      setLoadingReservations(prev => ({ ...prev, [dropId]: false }));
    }
  };

  const handlePurchase = async (dropId) => {
    if (!currentReservation || currentReservation.dropId !== dropId) return;
    try {
      setLoadingPurchases(prev => ({ ...prev, [dropId]: true }));
      await purchaseService.completePurchase(currentReservation.id);
      setCurrentReservation(null);
      addNotification('Purchase successful! 🎉', 'success');
      loadData(false);
    } catch (err) {
      addNotification(err.response?.data?.error || 'Purchase failed', 'danger');
    } finally {
      setLoadingPurchases(prev => ({ ...prev, [dropId]: false }));
    }
  };

  if (!user) {
    return (
      <div className="app-root">
        <nav className="app-nav">
          <div className="app-nav-logo">
            👟 <span>SNEAKER</span>-DROP
          </div>
        </nav>
        <main className="app-main">
          {authView === 'login' ? (
            <Login onLogin={handleAuth} onSwitch={() => setAuthView('register')} />
          ) : (
            <Register onRegister={handleAuth} onSwitch={() => setAuthView('login')} />
          )}
        </main>
        <div className="app-notifications">
          {notifications.map(n => (
            <div key={n.id} className={`app-toast ${n.variant}`}>
              {n.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
        <div className="app-root">
          <nav className="app-nav">
            <div className="app-nav-logo">
              👟 <span>SNEAKER</span>-DROP
            </div>
            <div className="app-nav-links">
              {['dashboard','history'].map((tab, i) => (
                  <button key={tab}
                          className={`app-nav-link ${activeTab === tab ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab)}>
                    {tab === 'dashboard' ? 'Marketplace' : 'Management'}
                  </button>
              ))}
            </div>
            <div className="app-nav-user" onClick={handleLogout} style={{ cursor: 'pointer' }} title="Click to logout">
              <div className="app-live-badge"><PulseDot /> Live</div>
              <div className="app-avatar">{user.fullName?.[0] || user.user?.[0]?.toUpperCase()}</div>
              <div className="app-username">{user.user}</div>
            </div>
          </nav>

          <main className="app-main">
            <div className="app-page-header">
              <div className="app-page-title">
               
                {activeTab === 'dashboard' ? 'Live Drop Dashboard' : 'History & Management'}
              </div>
              <div className="app-live-row">
                <PulseDot color="#00e676" />
                <span className="app-live-label">LIVE SYSTEM</span>
              </div>
            </div>

            {activeTab === 'dashboard' ? (
                loading ? (
                    <div className="app-spinner">
                      <div>Loading drops...</div>
                    </div>
                ) : drops.length === 0 ? (
                    <div className="app-empty">
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, marginBottom: 8 }}>No Active Drops</div>
                      <div style={{ fontSize: 11 }}>Check back later or initialize a new drop via API.</div>
                    </div>
                ) : (
                    <div className="app-grid">
                      {drops.map((drop, i) => (
                          <div key={drop.id} className="fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                            <DropCard
                                drop={drop}
                                onReserve={handleReserve}
                                onPurchase={handlePurchase}
                                loadingReservation={loadingReservations[drop.id]}
                                loadingPurchase={loadingPurchases[drop.id]}
                                currentReservation={currentReservation}
                            />
                          </div>
                      ))}
                    </div>
                )
            ) : (
                <div className="history-layout fade-up">
                  <div className="history-main">
                    <OrderHistory
                        purchases={purchases}
                        allPurchases={allPurchases}
                        currentUserId={user.id}
                    />
                  </div>

                  <div className="history-card">
                    <div className="history-title">Add New Drop</div>
                    <form className="admin-form" onSubmit={handleCreateDrop}>
                      <div className="form-group">
                        <label>Drop Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Jordan 1 Retro"
                            value={dropForm.name}
                            onChange={e => setDropForm({ ...dropForm, name: e.target.value })}
                            required
                        />
                      </div>
                      <div className="form-group">
                        <label>Price ($)</label>
                        <input
                            type="number"
                            placeholder="190"
                            value={dropForm.price}
                            onChange={e => setDropForm({ ...dropForm, price: e.target.value })}
                            required
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Stock</label>
                        <input
                            type="number"
                            placeholder="100"
                            value={dropForm.stock}
                            onChange={e => setDropForm({ ...dropForm, stock: e.target.value })}
                            required
                        />
                      </div>
                      <button className="form-submit-btn" type="submit" disabled={isCreatingDrop}>
                        {isCreatingDrop ? 'Initializing...' : 'Launch Drop'}
                      </button>
                    </form>
                  </div>
                </div>
            )}
          </main>

          <div className="app-toast-wrap">
            {notifications.map(n => (
                <div key={n.id} className={`app-toast ${n.variant}`}>{n.message}</div>
            ))}
          </div>
        </div>
  );
}