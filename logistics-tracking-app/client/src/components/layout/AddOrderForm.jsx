import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useEffect, useState } from "react";
import { Package, Truck, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/OrderDeliverySystem.css';
const WAREHOUSE = { lat: -33.92, lng: 18.42 };

const createIcon = (color, emoji) => {
  return L.icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
        <text x="20" y="26" font-size="18" text-anchor="middle">${emoji}</text>
      </svg>
    `)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const warehouseIcon = createIcon("#10b981", "🏭");
const customerIcon = createIcon("#ef4444", "📍");
const driverIcon = createIcon("#3b82f6", "🚗");


export default function OrderDeliverySystem() {
  const [view, setView] = useState("create"); // create, orders, tracking
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  // Form states
  const [newCustomer, setNewCustomer] = useState({
    shopName: "",
    address: "",
    lat: -33.95,
    lng: 18.45
  });

  const [newOrder, setNewOrder] = useState({
    customerId: "",
    items: "",
    notes: ""
  });

  // Initialize sample data
  useEffect(() => {
    initializeSampleData();
  }, []);

  const initializeSampleData = () => {
    // Sample customers
    const sampleCustomers = [
      { id: "C1", shopName: "Joe's Coffee", lat: -33.95, lng: 18.45, address: "123 Main St" },
      { id: "C2", shopName: "Tech Store", lat: -33.89, lng: 18.38, address: "456 Oak Ave" },
      { id: "C3", shopName: "Bakery Plus", lat: -33.93, lng: 18.50, address: "789 Pine Rd" },
    ];
    setCustomers(sampleCustomers);

    // Sample drivers
    const sampleDrivers = [
      { id: "DRIVER-10001", name: "John Smith", lat: WAREHOUSE.lat, lng: WAREHOUSE.lng, status: "available" },
      { id: "DRIVER-10002", name: "Sarah Jones", lat: -33.91, lng: 18.43, status: "available" },
    ];
    setDrivers(sampleDrivers);
  };

  // Add new customer
  const handleAddCustomer = () => {
    const customer = {
      id: `C${customers.length + 1}`,
      shopName: newCustomer.shopName,
      address: newCustomer.address,
      lat: newCustomer.lat,
      lng: newCustomer.lng
    };
    setCustomers([...customers, customer]);
    setNewCustomer({ shopName: "", address: "", lat: -33.95, lng: 18.45 });
    alert(`Customer "${customer.shopName}" added!`);
  };

  // Create order and assign driver
  const handleCreateOrder = () => {
    if (!newOrder.customerId) {
      alert("Please select a customer");
      return;
    }

    const customer = customers.find(c => c.id === newOrder.customerId);
    const availableDriver = drivers.find(d => d.status === "available");

    if (!availableDriver) {
      alert("No available drivers at the moment");
      return;
    }

    const order = {
      id: `ORDER-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.shopName,
      customerLocation: { lat: customer.lat, lng: customer.lng },
      driverId: availableDriver.id,
      driverName: availableDriver.name,
      items: newOrder.items.split(",").map(i => i.trim()),
      notes: newOrder.notes,
      status: "assigned",
      createdAt: new Date(),
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    };

    setOrders([...orders, order]);

    // Update driver status
    setDrivers(drivers.map(d =>
      d.id === availableDriver.id
        ? { ...d, status: "busy", currentOrder: order.id }
        : d
    ));

    // Start simulating driver movement
    simulateDelivery(order.id, availableDriver.id, customer.lat, customer.lng);

    setNewOrder({ customerId: "", items: "", notes: "" });
    setView("orders");
    alert(`Order created and assigned to ${availableDriver.name}!`);
  };

  // Simulate driver moving to customer
  const simulateDelivery = (orderId, driverId, targetLat, targetLng) => {
    const steps = 60;
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(interval);
        // Mark as delivered
        setOrders(prev => prev.map(o =>
          o.id === orderId
            ? { ...o, status: "delivered", actualDeliveryTime: new Date() }
            : o
        ));
        setDrivers(prev => prev.map(d =>
          d.id === driverId
            ? { ...d, status: "available", currentOrder: null, lat: WAREHOUSE.lat, lng: WAREHOUSE.lng }
            : d
        ));
        return;
      }

      const progress = currentStep / steps;

      // Move to customer (first half)
      if (currentStep < steps / 2) {
        const p = (currentStep / (steps / 2));
        const lat = WAREHOUSE.lat + (targetLat - WAREHOUSE.lat) * p;
        const lng = WAREHOUSE.lng + (targetLng - WAREHOUSE.lng) * p;

        setDrivers(prev => prev.map(d =>
          d.id === driverId ? { ...d, lat, lng } : d
        ));

        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: "in_transit" } : o
        ));
      }
      // Return to warehouse (second half)
      else {
        const p = ((currentStep - steps / 2) / (steps / 2));
        const lat = targetLat + (WAREHOUSE.lat - targetLat) * p;
        const lng = targetLng + (WAREHOUSE.lng - targetLng) * p;

        setDrivers(prev => prev.map(d =>
          d.id === driverId ? { ...d, lat, lng } : d
        ));
      }

      currentStep++;
    }, 200);
  };

  // Track specific order
  const trackOrder = (order) => {
    setSelectedOrder(order);
    const driver = drivers.find(d => d.id === order.driverId);
    if (driver) {
      setDriverLocation({ lat: driver.lat, lng: driver.lng });
    }
    setView("tracking");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500",
      assigned: "bg-blue-500",
      in_transit: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="delivery-system-container">
      {/* Sidebar */}
      <div className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-title">📦 Delivery System</div>
          <div className="sidebar-subtitle">Real-time Logistics Tracking</div>
          <div className="nav-tabs">
            <button
              onClick={() => setView("create")}
              className={`nav-tab ${view === "create" ? "nav-tab-active" : "nav-tab-inactive"}`}
            >
              <span>Create Order</span>
            </button>
            <button
              onClick={() => setView("orders")}
              className={`nav-tab ${view === "orders" ? "nav-tab-active" : "nav-tab-inactive"}`}
            >
              <span>Orders ({orders.length})</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="sidebar-content">
          {view === "create" && (
            <div>
              {/* Add Customer Section */}
              <div className="card">
                <h2 className="card-title">
                  <MapPin size={20} /> Add New Customer
                </h2>
                <div>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Shop Name"
                      value={newCustomer.shopName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, shopName: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Latitude"
                      value={newCustomer.lat}
                      onChange={(e) => setNewCustomer({ ...newCustomer, lat: parseFloat(e.target.value) })}
                      className="form-input"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Longitude"
                      value={newCustomer.lng}
                      onChange={(e) => setNewCustomer({ ...newCustomer, lng: parseFloat(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <button
                    onClick={handleAddCustomer}
                    disabled={!newCustomer.shopName}
                    className={`btn ${!newCustomer.shopName ? 'btn-disabled' : 'btn-success'}`}
                  >
                    <span>Add Customer</span>
                  </button>
                </div>
              </div>

              {/* Create Order Section */}
              <div className="card">
                <h2 className="card-title">
                  <Package size={20} /> Create New Order
                </h2>
                <div>
                  <div className="form-group">
                    <select
                      value={newOrder.customerId}
                      onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.shopName} - {c.address}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Items (comma separated)"
                      value={newOrder.items}
                      onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      placeholder="Delivery notes..."
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                      className="form-textarea"
                    />
                  </div>
                  <button
                    onClick={handleCreateOrder}
                    disabled={!newOrder.customerId || !newOrder.items}
                    className={`btn ${(!newOrder.customerId || !newOrder.items) ? 'btn-disabled' : 'btn-primary'}`}
                  >
                    <span>Create Order & Assign Driver</span>
                  </button>
                </div>
              </div>

              {/* Available Drivers */}
              <div className="card">
                <h3 className="card-title">
                  <Truck size={16} /> Available Drivers
                </h3>
                <div className="driver-list">
                  {drivers.filter(d => d.status === "available").map(driver => (
                    <div key={driver.id} className="driver-item">
                      {driver.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === "orders" && (
            <div>
              <h2 className="card-title" style={{ marginBottom: '20px' }}>All Orders</h2>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <p>No orders yet. Create your first order!</p>
                </div>
              ) : (
                <div className="order-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card" onClick={() => trackOrder(order)}>
                      <div className="order-header">
                        <div>
                          <div className="order-title">{order.customerName}</div>
                          <div className="order-id">{order.id}</div>
                        </div>
                        <span className={`status-badge status-${order.status.replace('_', '-')}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-details">
                        <p>🚗 Driver: {order.driverName}</p>
                        <p>📦 Items: {order.items.join(", ")}</p>
                        <p>🕐 Created: {order.createdAt.toLocaleTimeString()}</p>
                      </div>
                      <button className="btn btn-primary">
                        <span>Track on Map</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "tracking" && selectedOrder && (
            <div>
              <div className="tracking-header">
                <button onClick={() => setView("orders")} className="back-button">
                  ← Back to Orders
                </button>
              </div>
              <div className="card tracking-info">
                <h2 className="card-title">Order Tracking</h2>
                <div className="tracking-row">
                  <div className="tracking-label">Order</div>
                  <div className="tracking-value">{selectedOrder.id}</div>
                </div>
                <div className="tracking-row">
                  <div className="tracking-label">Customer</div>
                  <div className="tracking-value">{selectedOrder.customerName}</div>
                </div>
                <div className="tracking-row">
                  <div className="tracking-label">Driver</div>
                  <div className="tracking-value">{selectedOrder.driverName}</div>
                </div>
                <div className="tracking-row">
                  <div className="tracking-label">Status</div>
                  <span className={`status-badge status-${selectedOrder.status.replace('_', '-')}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="tracking-row">
                  <div className="tracking-label">Items</div>
                  <div className="tracking-value">{selectedOrder.items.join(", ")}</div>
                </div>
                {selectedOrder.notes && (
                  <div className="tracking-row">
                    <div className="tracking-label">Notes</div>
                    <div className="tracking-value">{selectedOrder.notes}</div>
                  </div>
                )}
                {selectedOrder.status === "delivered" && selectedOrder.actualDeliveryTime && (
                  <div className="delivery-success">
                    <CheckCircle size={16} />
                    Delivered at {selectedOrder.actualDeliveryTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <div className="map-wrapper">
          <MapContainer
            center={[WAREHOUSE.lat, WAREHOUSE.lng]}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            {/* Your existing map code stays the same */}
          </MapContainer>
        </div>

        {/* Stats Overlay */}
        <div className="stats-overlay">
          <div className="stats-title">Live Statistics</div>
          <div className="stat-item">
            <Package size={16} className="stat-icon" />
            <span className="stat-label">Total Orders:</span>
            <span className="stat-value">{orders.length}</span>
          </div>
          <div className="stat-item">
            <Truck size={16} className="stat-icon" />
            <span className="stat-label">Active:</span>
            <span className="stat-value">
              {orders.filter(o => o.status === "in_transit" || o.status === "assigned").length}
            </span>
          </div>
          <div className="stat-item">
            <CheckCircle size={16} className="stat-icon" />
            <span className="stat-label">Delivered:</span>
            <span className="stat-value">{orders.filter(o => o.status === "delivered").length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}