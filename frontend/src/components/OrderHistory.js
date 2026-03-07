import React, { useState, useMemo } from 'react';
import './OrderHistory.css';

const OrderHistory = ({ purchases, allPurchases, currentUserId }) => {
  const [activeTab, setActiveTab] = useState('myOrders');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get the correct data based on active tab
  const orders = activeTab === 'myOrders' ? purchases : allPurchases;

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = useMemo(() => {
    return orders.slice(startIndex, startIndex + itemsPerPage);
  }, [orders, startIndex, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Pagination controls
  const PaginationControls = () => (
    <div className="pagination-container">
      <div className="pagination-info">
        {orders.length === 0 ? (
          <span>No orders</span>
        ) : (
          <span>
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, orders.length)}</strong> of <strong>{orders.length}</strong>
          </span>
        )}
      </div>

      <div className="pagination-controls">
        <select className="items-per-page" value={itemsPerPage} onChange={handleItemsPerPageChange}>
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>

        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="First page"
          >
            ⟨⟨
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
          >
            ⟨
          </button>

          <div className="pagination-pages">
            {totalPages <= 5 ? (
              Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))
            ) : (
              <>
                {currentPage > 2 && (
                  <>
                    <button className="pagination-page" onClick={() => handlePageChange(1)}>1</button>
                    {currentPage > 3 && <span className="pagination-dots">...</span>}
                  </>
                )}
                {currentPage - 1 > 0 && (
                  <button className="pagination-page" onClick={() => handlePageChange(currentPage - 1)}>
                    {currentPage - 1}
                  </button>
                )}
                <button className="pagination-page active">{currentPage}</button>
                {currentPage + 1 <= totalPages && (
                  <button className="pagination-page" onClick={() => handlePageChange(currentPage + 1)}>
                    {currentPage + 1}
                  </button>
                )}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="pagination-dots">...</span>}
                    <button className="pagination-page" onClick={() => handlePageChange(totalPages)}>
                      {totalPages}
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            ⟩
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
          >
            ⟩⟩
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="order-history-dashboard fade-up">
      <div className="order-history-header">
        <div className="order-history-tabs">
          <button
            className={`order-tab ${activeTab === 'myOrders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('myOrders');
              setCurrentPage(1);
            }}
          >
            <span className="tab-icon">📋</span>
            My Orders
          </button>
          <button
            className={`order-tab ${activeTab === 'allOrders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('allOrders');
              setCurrentPage(1);
            }}
          >
            <span className="tab-icon">🌐</span>
            All Orders
          </button>
        </div>
        <div className="order-count-badge">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="order-empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">
            {activeTab === 'myOrders' ? 'No orders yet' : 'No system orders'}
          </div>
          <div className="empty-message">
            {activeTab === 'myOrders'
              ? 'Start shopping to see your purchases here'
              : 'No orders have been placed in the system yet'}
          </div>
        </div>
      ) : (
        <>
          <div className="order-table-wrapper">
            <table className="order-table">
              <thead>
                <tr>
                  <th className="col-date">Date</th>
                  <th className="col-product">Product</th>
                  {activeTab === 'allOrders' && <th className="col-user">Customer</th>}
                  <th className="col-price">Price</th>
                  <th className="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="order-row">
                    <td className="col-date">
                      <div className="date-value">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="time-value">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="col-product">
                      <div className="product-name">{order.Drop?.name || 'Unknown Item'}</div>
                      <div className="product-id">ID: {order.id.substring(0, 8)}</div>
                    </td>
                    {activeTab === 'allOrders' && (
                      <td className="col-user">
                        <div className="user-badge">{order.User?.user || order.userId}</div>
                      </td>
                    )}
                    <td className="col-price">
                      <div className="price-amount">
                        ${parseFloat(order.Drop?.price || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="col-status">
                      <span className="status-badge status-completed">Completed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls />
        </>
      )}
    </div>
  );
};

export default OrderHistory;
