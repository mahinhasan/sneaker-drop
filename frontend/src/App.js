import React, { useState, useEffect } from 'react';
import { dropService, reservationService, purchaseService } from './services/api';
import DropCard from './components/DropCard';
import './App.css';

const PulseDot = ({ color = '#ff1744' }) => (
    <span className="app-pulse-dot" style={{ background: color }} />
);

export default function App() {
  const [drops, setDrops] = useState([]);
  const [user] = useState({ id: 'user-1', user: 'alice' });
  const [currentReservation, setCurrentReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState({});
  const [loadingPurchases, setLoadingPurchases] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await dropService.getDrops();
      setDrops(data);
    } catch (err) {
      addNotification('Failed to load drops', 'danger');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const addNotification = (message, variant = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, variant }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const handleReserve = async (dropId) => {
    if (currentReservation) { addNotification('You already have a reservation', 'warning'); return; }
    try {
      setLoadingReservations(prev => ({ ...prev, [dropId]: true }));
      const res = await reservationService.reserveItem(user.id, dropId);
      setCurrentReservation({ id: res.reservation.id, dropId: res.reservation.dropId, expiresAt: res.reservation.expiresAt });
      addNotification('Item reserved for 60 seconds!', 'success');
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

  return (
        <div className="app-root">
          {/* NAV */}
          <nav className="app-nav">
            <div className="app-nav-logo">
              👟 <span>SNEAKER</span>-DROP
            </div>
            <div className="app-nav-links">
              {['dashboard','history'].map((tab, i) => (
                  <button key={tab}
                          className={`app-nav-link ${activeTab === tab ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab)}>
                    {tab === 'dashboard' ? 'Dashboard' : 'Order History'}
                  </button>
              ))}
            </div>
            <div className="app-nav-user">
              <div className="app-live-badge"><PulseDot /> Live</div>
              <div className="app-avatar">A</div>
              <div className="app-username">{user.user}</div>
            </div>
          </nav>

          {/* MAIN */}
          <main className="app-main">
            <div className="app-page-header">
              <div className="app-page-title">
                <small className="app-page-sub">// inventory status</small>
                Live Drop Dashboard
              </div>
              <div className="app-live-row">
                <PulseDot color="#00e676" />
                <span className="app-live-label">LIVE SYSTEM</span>
              </div>
            </div>

            {loading ? (
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
            )}
          </main>

          {/* TOASTS */}
          <div className="app-toast-wrap">
            {notifications.map(n => (
                <div key={n.id} className={`app-toast ${n.variant}`}>{n.message}</div>
            ))}
          </div>
        </div>
  );
}