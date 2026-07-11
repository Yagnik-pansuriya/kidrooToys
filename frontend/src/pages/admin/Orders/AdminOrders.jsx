import { useState } from 'react';
import { 
  useGetAllOrdersQuery, 
  useGetAdminOrderByIdQuery, 
  useUpdateOrderStatusMutation, 
  useConfirmAdminOrderMutation 
} from '../../../store/ActionApi/orderApi';
import { 
  FiEye, 
  FiCheck, 
  FiDownload, 
  FiPrinter, 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiClock, 
  FiTruck, 
  FiFileText,
  FiLoader
} from 'react-icons/fi';
import { useToast } from '../../../context/ToastContext';
import Loader from '../../../components/Loader/Loader';
import './AdminOrders.scss';

const AdminOrders = () => {
  const { showSuccess, showError } = useToast();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);

  // Queries
  const { data: ordersResp, isLoading: isLoadingList, refetch: refetchList } = useGetAllOrdersQuery({
    search: searchTerm,
    status: statusFilter,
    paymentStatus: paymentFilter,
    page,
    limit: 10
  });

  const orders = ordersResp?.data?.orders || [];
  const pagination = ordersResp?.data?.pagination || { total: 0, pages: 1 };

  // Selected Order details
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { data: detailResp, isLoading: isLoadingDetail } = useGetAdminOrderByIdQuery(selectedOrderId, {
    skip: !selectedOrderId
  });
  const orderDetail = detailResp?.data?.order || null;
  const trackingData = detailResp?.data?.tracking || null;

  // Mutations
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [confirmOrder, { isLoading: isConfirming }] = useConfirmAdminOrderMutation();

  // Shiprocket automated confirmation progress modal state
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Creating Order, 2: Assigning AWB, 3: Printing Documents, 4: Scheduling Pickup, 5: Done

  const handleManualStatusUpdate = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      showSuccess(`Order status updated to ${status}`);
    } catch (err) {
      showError(err?.data?.message || 'Failed to update order status');
    }
  };

  const handleConfirmOrderPipeline = async (id) => {
    setConfirmingOrderId(id);
    setCurrentStep(1); // Creating Order in Shiprocket
    
    try {
      // Step 1: Hit API (does order create + AWB assign + document generate + pickup schedule)
      const res = await confirmOrder(id).unwrap();
      
      setCurrentStep(2); // Mock/real progress indicators for user wow-factor
      await new Promise(r => setTimeout(r, 800));
      
      setCurrentStep(3); // Generating AWB
      await new Promise(r => setTimeout(r, 800));
      
      setCurrentStep(4); // Generating Manifests & Labels
      await new Promise(r => setTimeout(r, 800));
      
      setCurrentStep(5); // Scheduling Pickup
      await new Promise(r => setTimeout(r, 500));
      
      showSuccess('Order verified, booked and scheduled via Shiprocket!');
      refetchList();
    } catch (err) {
      showError(err?.data?.message || 'Failed during Shiprocket confirmation pipeline');
    } finally {
      // Keep confirmation overlay up for a moment, then close
      setTimeout(() => {
        setConfirmingOrderId(null);
        setCurrentStep(0);
      }, 1000);
    }
  };

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1>Manage Orders</h1>
        <p>Confirm orders, allocate courier services and track packages through Shiprocket API.</p>
      </div>

      {/* Filters & Actions bar */}
      <div className="admin-orders__filters">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Client Name or Mobile..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <FiFilter className="filter-icon" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending Confirmation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-item">
            <FiFilter className="filter-icon" />
            <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}>
              <option value="">Payment Status</option>
              <option value="Pending">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Order Table */}
      {isLoadingList ? (
        <Loader message="Loading orders..." />
      ) : orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders__icon">📦</div>
          <h3>No Orders Found</h3>
          <p>No customer orders match the selected filters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-orders__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="order-id-cell">{order.orderId}</td>
                  <td>
                    <div className="customer-info-cell">
                      <strong>{order.customer?.firstName} {order.customer?.lastName}</strong>
                      <span>{order.customer?.mobile}</span>
                    </div>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="amount-cell">₹{(order.netAmount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`payment-badge payment-badge--${order.paymentStatus.toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>
                    <small className="payment-method-text">{order.paymentMethod === 'cod' ? 'COD' : 'Razorpay'}</small>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-icon--view" 
                        title="View Details"
                        onClick={() => setSelectedOrderId(order._id)}
                      >
                        <FiEye />
                      </button>
                      
                      {order.status === 'Pending' && (
                        <button 
                          className="btn-confirm-action"
                          onClick={() => handleConfirmOrderPipeline(order._id)}
                          disabled={order.paymentStatus === 'Pending' && order.paymentMethod === 'online'}
                        >
                          <FiCheck /> Confirm Order
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                className="pagination__btn"
              >
                Previous
              </button>
              <span className="pagination__info">Page {page} of {pagination.pages}</span>
              <button 
                disabled={page === pagination.pages} 
                onClick={() => setPage(page + 1)}
                className="pagination__btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Side-Drawer Panel */}
      {selectedOrderId && (
        <div className="details-drawer-overlay" onClick={() => setSelectedOrderId(null)}>
          <div className="details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="details-drawer__header">
              <h3>Order Details: {orderDetail?.orderId}</h3>
              <button className="close-btn" onClick={() => setSelectedOrderId(null)}>
                <FiX />
              </button>
            </div>

            {isLoadingDetail ? (
              <Loader message="Loading details..." />
            ) : !orderDetail ? (
              <div className="p-4">Failed to load order information.</div>
            ) : (
              <div className="details-drawer__content">
                
                {/* Status Update section */}
                <div className="drawer-section drawer-section--status">
                  <h4>Status Manager</h4>
                  <div className="status-mgr-row">
                    <div className="select-wrapper">
                      <select 
                        value={orderDetail.status} 
                        onChange={(e) => handleManualStatusUpdate(orderDetail._id, e.target.value)}
                        disabled={isUpdatingStatus}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    {orderDetail.status === 'Pending' && (
                      <button 
                        className="btn-confirm-action" 
                        onClick={() => handleConfirmOrderPipeline(orderDetail._id)}
                      >
                        Confirm & Book Shiprocket
                      </button>
                    )}
                  </div>
                </div>

                {/* Shiprocket Documents Download */}
                {orderDetail.shiprocketOrderId && (
                  <div className="drawer-section drawer-section--docs">
                    <h4>Shiprocket Shipping Materials</h4>
                    <div className="docs-grid">
                      {orderDetail.shiprocketLabelUrl && (
                        <a href={orderDetail.shiprocketLabelUrl} target="_blank" rel="noreferrer" className="doc-link">
                          <FiPrinter /> Shipping Label
                        </a>
                      )}
                      {orderDetail.shiprocketInvoiceUrl && (
                        <a href={orderDetail.shiprocketInvoiceUrl} target="_blank" rel="noreferrer" className="doc-link">
                          <FiFileText /> Customer Invoice
                        </a>
                      )}
                      {orderDetail.shiprocketManifestUrl && (
                        <a href={orderDetail.shiprocketManifestUrl} target="_blank" rel="noreferrer" className="doc-link">
                          <FiDownload /> Courier Manifest
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Items grid */}
                <div className="drawer-section">
                  <h4>Items Summary</h4>
                  <div className="drawer-items">
                    {orderDetail.items.map((item, idx) => (
                      <div className="drawer-item" key={item._id || idx}>
                        <img src={item.image || 'placeholder.jpg'} alt={item.productName} />
                        <div className="drawer-item__info">
                          <h5>{item.productName}</h5>
                          {item.skuCode && <span className="sku">SKU: {item.skuCode}</span>}
                          <span className="qty">{item.quantity} × ₹{(item.price || 0).toFixed(2)}</span>
                        </div>
                        <span className="total">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ship Address */}
                <div className="drawer-section">
                  <h4>Delivery Address</h4>
                  <p className="address-block">
                    <strong>{orderDetail.shippingAddress.fullName}</strong><br />
                    {orderDetail.shippingAddress.houseNo && `${orderDetail.shippingAddress.houseNo}, `}
                    {orderDetail.shippingAddress.street}<br />
                    {orderDetail.shippingAddress.landmark && `Landmark: ${orderDetail.shippingAddress.landmark}`}<br />
                    {orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.state} - {orderDetail.shippingAddress.zipCode}<br />
                    <strong>Tel:</strong> {orderDetail.shippingAddress.phone}
                  </p>
                </div>

                {/* Bill Breakdown */}
                <div className="drawer-section">
                  <h4>Payment Breakdown</h4>
                  <div className="breakdown-list">
                    <div className="breakdown-row">
                      <span>Subtotal</span>
                      <span>₹{(orderDetail.totalItemsPrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Shipping Fees</span>
                      <span>₹{(orderDetail.shippingCharges || 0).toFixed(2)}</span>
                    </div>
                    {(orderDetail.couponDiscount || 0) > 0 && (
                      <div className="breakdown-row breakdown-row--discount">
                        <span>Discount ({orderDetail.couponCode})</span>
                        <span>-₹{(orderDetail.couponDiscount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="breakdown-divider" />
                    <div className="breakdown-row breakdown-row--total">
                      <span>Net Total</span>
                      <span>₹{(orderDetail.netAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shiprocket Tracker details */}
                <div className="drawer-section">
                  <h4>Fulfillment Tracking</h4>
                  {orderDetail.shiprocketAwbNumber ? (
                    <div className="tracking-summary">
                      <div className="tracking-grid-meta">
                        <div><strong>Courier:</strong> {orderDetail.shiprocketCourierCompany}</div>
                        <div><strong>AWB Code:</strong> {orderDetail.shiprocketAwbNumber}</div>
                        <div><strong>Shiprocket ID:</strong> {orderDetail.shiprocketOrderId}</div>
                      </div>

                      {trackingData?.history ? (
                        <div className="tracking-steps-log">
                          {trackingData.history.map((step, idx) => (
                            <div key={idx} className={`log-step ${step.done ? 'log-step--done' : ''}`}>
                              <span className="log-step__bullet"></span>
                              <div className="log-step__info">
                                <span className="log-step__title">{step.status}</span>
                                {step.activity && <span className="log-step__desc">{step.activity}</span>}
                                {step.date && <span className="log-step__time">{new Date(step.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-log">Courier tracking information is being calculated. Please check back shortly.</p>
                      )}
                    </div>
                  ) : (
                    <p className="no-log">Order is not confirmed yet. Click 'Confirm Order' to book with Shiprocket and generate tracking numbers.</p>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Automated Stepper Progress Modal */}
      {confirmingOrderId && (
        <div className="stepper-modal-overlay">
          <div className="stepper-modal">
            <h3><FiLoader className="stepper-spinner" /> Shiprocket Fulfillment Pipeline</h3>
            <p>Automating parcel booking and shipping generation. Please do not close this window.</p>
            
            <div className="steps-container">
              <div className={`step-item ${currentStep >= 1 ? 'step-item--active' : ''} ${currentStep > 1 ? 'step-item--done' : ''}`}>
                <div className="step-badge">{currentStep > 1 ? <FiCheck /> : '1'}</div>
                <span>Syncing Order to Shiprocket</span>
              </div>
              
              <div className={`step-item ${currentStep >= 2 ? 'step-item--active' : ''} ${currentStep > 2 ? 'step-item--done' : ''}`}>
                <div className="step-badge">{currentStep > 2 ? <FiCheck /> : '2'}</div>
                <span>Checking Courier rates & routes</span>
              </div>

              <div className={`step-item ${currentStep >= 3 ? 'step-item--active' : ''} ${currentStep > 3 ? 'step-item--done' : ''}`}>
                <div className="step-badge">{currentStep > 3 ? <FiCheck /> : '3'}</div>
                <span>Registering AWB Tracking Code</span>
              </div>

              <div className={`step-item ${currentStep >= 4 ? 'step-item--active' : ''} ${currentStep > 4 ? 'step-item--done' : ''}`}>
                <div className="step-badge">{currentStep > 4 ? <FiCheck /> : '4'}</div>
                <span>Compiling Labels, manifests & invoice PDFs</span>
              </div>

              <div className={`step-item ${currentStep >= 5 ? 'step-item--active' : ''} ${currentStep > 5 ? 'step-item--done' : ''}`}>
                <div className="step-badge">{currentStep > 5 ? <FiCheck /> : '5'}</div>
                <span>Scheduling Courier driver pickup</span>
              </div>
            </div>

            {currentStep === 5 && (
              <div className="stepper-success">
                🎉 Step Completed Successfully!
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
