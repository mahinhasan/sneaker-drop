import { useEffect, useState } from 'react';
import './DropCard.css';

export default function DropCard({ drop, onReserve, onPurchase, loadingReservation, loadingPurchase, currentReservation }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const isReservedByMe = currentReservation && currentReservation.dropId === drop.id;
  const pct = Math.round((drop.availableStock / drop.totalStock) * 100);
  const isLow = drop.availableStock < 10;

  useEffect(() => {
    let timer;
    if (isReservedByMe && currentReservation.expiresAt) {
      const calc = () => Math.max(0, Math.ceil((new Date(currentReservation.expiresAt) - new Date()) / 1000));
      setTimeLeft(calc());
      timer = setInterval(() => {
        const r = calc();
        setTimeLeft(r);
        if (r <= 0) clearInterval(timer);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isReservedByMe, currentReservation]);

  return (
        <div className={`drop-card ${isReservedByMe ? 'reserved' : ''}`}>
          {/* Status bar */}
          <div className={`drop-card-top-bar ${drop.availableStock > 0 ? 'available' : 'sold-out'}`}>
            {drop.availableStock > 0 ? `● Available Now` : '✕ Sold Out'}
          </div>

          <div className="drop-card-body">
            {/* Name + Price */}
            <div className="drop-card-header">
              <div className="drop-card-name">{drop.name}</div>
              <div className="drop-card-price">${parseFloat(drop.price).toLocaleString()}</div>
            </div>

            {/* Stock bar */}
            <div className="drop-card-stock-section">
              <div className="drop-card-stock-row">
                <span>Inventory Level</span>
                <span className="drop-card-stock-count">
                  {drop.availableStock} <span className="drop-card-stock-muted">/ {drop.totalStock}</span>
                </span>
              </div>
              <div className="drop-card-bar-bg">
                <div 
                  className={`drop-card-bar-fill ${isLow ? 'low' : 'normal'}`} 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>

            {/* Reservation timer */}
            {isReservedByMe && timeLeft > 0 && (
                <div className="drop-card-reserved-box">
                  <span>Reserved</span>
                  <span className="drop-card-timer">{timeLeft}s</span>
                </div>
            )}

            {/* CTA Button */}
            <div style={{ marginTop: 'auto' }}>
              {isReservedByMe ? (
                  <button
                      className="drop-card-btn drop-card-btn-buy"
                      onClick={() => onPurchase(drop.id)}
                      disabled={loadingPurchase || timeLeft <= 0}
                  >
                    {loadingPurchase ? '...' : 'Complete Purchase →'}
                  </button>
              ) : (
                  <button
                      className="drop-card-btn drop-card-btn-res"
                      onClick={() => onReserve(drop.id)}
                      disabled={drop.availableStock === 0 || loadingReservation || !!currentReservation}
                  >
                    {loadingReservation ? '...' : 'Reserve Item'}
                  </button>
              )}
            </div>

            {/* Purchase feed */}
            {drop.Purchases && drop.Purchases.length > 0 && (
                <div className="drop-card-feed">
                  <div className="drop-card-feed-label">Live Purchase Feed</div>
                  {drop.Purchases.map((p) => (
                      <div key={p.id} className="drop-card-feed-item">
                        <span className="drop-card-feed-dot" />
                        <span className="drop-card-feed-user">{p.User.user}</span>
                        <span>just secured a pair</span>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
  );
}