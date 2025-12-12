// Home.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Package, Truck, TrendingUp, Clock, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/layout/navbar.jsx';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Home.css';

const Home = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statistics, setStatistics] = useState({
    ordersToday: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
    productsAdded: 0,
    vendorsAdded: 0,
    vehiclesAdded: 0,
    customersAdded: 0
  });
  const [chartData, setChartData] = useState({
    orderTrend: [],
    statusDistribution: [],
    weeklyOrders: []
  });
  const [metrics, setMetrics] = useState({
    activeDeliveries: 0,
    pendingOrders: 0,
    driversOnline: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const config = getAuthHeaders();

      const [
        activeDeliveriesRes,
        allOrdersRes,
        driversRes,
        productsRes,
        vendorsRes,
        vehiclesRes
      ] = await Promise.all([
        axios.get('http://localhost:3000/api/orders/GetActiveDeliveries', config).catch(e => ({ data: [] })),
        axios.get('http://localhost:3000/api/orders/GetAllOrders', config).catch(e => ({ data: [] })),
        axios.get('http://localhost:3000/api/drivers/GetDriverLocations', config).catch(e => ({ data: [] })),
        axios.get('http://localhost:3000/api/products/GetProducts', config).catch(e => ({ data: { listOfProducts: [] } })),
        axios.get('http://localhost:3000/api/vendors/GetVendors', config).catch(e => ({ data: { listOfVendors: [] } })),
        axios.get('http://localhost:3000/api/vehicles/GetAllVehicles', config).catch(e => ({ data: [] }))
      ]);

      const deliveries = Array.isArray(activeDeliveriesRes.data) ? activeDeliveriesRes.data : [];
      setActiveDeliveries(deliveries);

      const allOrders = Array.isArray(allOrdersRes.data) ? allOrdersRes.data : [];
      setOrders(allOrders);

      const driverData = Array.isArray(driversRes.data) ? driversRes.data : [];
      setDrivers(driverData);

      const productData = productsRes.data.listOfProducts || productsRes.data || [];
      setProducts(Array.isArray(productData) ? productData : []);

      const vendorData = vendorsRes.data.listOfVendors || vendorsRes.data || [];
      setVendors(Array.isArray(vendorData) ? vendorData : []);

      const vehicleData = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
      setVehicles(vehicleData);

      const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
      const completedToday = allOrders.filter(o => {
        const today = new Date().toDateString();
        return o.status === 'delivered' && 
               o.actualDeliveryTime && 
               new Date(o.actualDeliveryTime).toDateString() === today;
      }).length;

      // Calculate statistics
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const ordersToday = allOrders.filter(o => new Date(o.createdAt) >= todayStart).length;
      const ordersThisWeek = allOrders.filter(o => new Date(o.createdAt) >= weekStart).length;
      const ordersThisMonth = allOrders.filter(o => new Date(o.createdAt) >= monthStart).length;
      
      const productsAdded = productData.filter(p => new Date(p.createdAt) >= monthStart).length;
      const vendorsAdded = vendorData.filter(v => new Date(v.createdAt) >= monthStart).length;
      const vehiclesAdded = vehicleData.filter(v => new Date(v.createdAt) >= monthStart).length;

      setStatistics({
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        productsAdded,
        vendorsAdded,
        vehiclesAdded,
        totalOrders: allOrders.length,
        totalProducts: productData.length,
        totalVendors: vendorData.length,
        totalVehicles: vehicleData.length
      });

      // Prepare chart data
      // 1. Order trend over last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const ordersOnDay = allOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate < dayEnd;
        }).length;
        
        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          orders: ordersOnDay
        });
      }

      // 2. Status distribution for pie chart
      const statusCounts = {
        pending: allOrders.filter(o => o.status === 'pending').length,
        assigned: allOrders.filter(o => o.status === 'assigned').length,
        picked_up: allOrders.filter(o => o.status === 'picked_up').length,
        in_transit: allOrders.filter(o => o.status === 'in_transit').length,
        delivered: allOrders.filter(o => o.status === 'delivered').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length
      };

      const statusDistribution = [
        { name: 'Pending', value: statusCounts.pending, color: '#eab308' },
        { name: 'Assigned', value: statusCounts.assigned, color: '#3b82f6' },
        { name: 'Picked Up', value: statusCounts.picked_up, color: '#a855f7' },
        { name: 'In Transit', value: statusCounts.in_transit, color: '#6366f1' },
        { name: 'Delivered', value: statusCounts.delivered, color: '#10b981' },
        { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' }
      ].filter(item => item.value > 0);

      // 3. Weekly comparison
      const weeklyOrders = [
        { name: 'Mon', orders: 0 },
        { name: 'Tue', orders: 0 },
        { name: 'Wed', orders: 0 },
        { name: 'Thu', orders: 0 },
        { name: 'Fri', orders: 0 },
        { name: 'Sat', orders: 0 },
        { name: 'Sun', orders: 0 }
      ];

      allOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= weekStart) {
          const dayOfWeek = orderDate.getDay(); // 0 = Sunday, 6 = Saturday
          const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0, Sun=6
          weeklyOrders[dayIndex].orders++;
        }
      });

      setChartData({
        orderTrend: last7Days,
        statusDistribution,
        weeklyOrders
      });

      const onlineDrivers = driverData.length;

      setMetrics({
        activeDeliveries: deliveries.length,
        pendingOrders,
        driversOnline: onlineDrivers,
        completedToday
      });

      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleAssignDriver = async (orderId) => {
    try {
      const config = getAuthHeaders();
      await axios.post('http://localhost:3000/api/orders/CreateOrder', {
        orderId
      }, config);
      
      fetchDashboardData();
      alert('Driver assigned successfully!');
    } catch (err) {
      console.error('Error assigning driver:', err);
      alert('Failed to assign driver: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const config = getAuthHeaders();
      await axios.patch('http://localhost:3000/api/orders/UpdateDeliveryStatus', {
        orderId,
        status: newStatus
      }, config);
      
      fetchDashboardData();
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      assigned: 'status-assigned',
      picked_up: 'status-picked-up',
      in_transit: 'status-in-transit',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };
    return classes[status] || 'status-default';
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const targetDate = new Date(date);
    const diff = Math.floor((targetDate - now) / 60000);
    if (diff < 0) return 'Overdue';
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const formatElapsedTime = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const targetDate = new Date(date);
    const diff = Math.floor((now - targetDate) / 60000);
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  const MetricCard = ({ icon: Icon, title, value, colorClass }) => (
    <div className="metric-card">
      <div className="metric-card-content">
        <div className="metric-info">
          <p className="metric-title">{title}</p>
          <p className="metric-value">{value}</p>
        </div>
        <div className={`metric-icon ${colorClass}`}>
          <Icon className="icon" />
        </div>
      </div>
    </div>
  );

  const DeliveryMap = () => (
    <div className="map-container">
      <h2 className="section-title">Live Delivery Map</h2>
      <div className="map-canvas">
        <div className="map-background">
          <div className="warehouse-marker">
            <div className="marker-dot"></div>
            <span className="marker-label">Warehouse</span>
          </div>

          {activeDeliveries.map((delivery, idx) => (
            delivery.driverLocation && (
              <div 
                key={delivery.orderId}
                className="driver-marker"
                style={{ 
                  left: `${45 + (idx * 8) % 30}%`, 
                  top: `${48 + (idx * 5) % 20}%` 
                }}
              >
                <Truck className="marker-icon driver-icon" />
                <span className="marker-label">{delivery.driverId}</span>
              </div>
            )
          ))}

          {activeDeliveries.map((delivery, idx) => (
            delivery.customerLocation && (
              <div 
                key={`customer-${delivery.orderId}`}
                className="customer-marker"
                style={{ 
                  left: `${55 + (idx * 7) % 25}%`, 
                  top: `${45 + (idx * 6) % 25}%` 
                }}
              >
                <MapPin className="marker-icon customer-icon" />
                <span className="marker-label">{delivery.customerName}</span>
              </div>
            )
          ))}
        </div>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-dot warehouse"></div>
            <span>Warehouse</span>
          </div>
          <div className="legend-item">
            <Truck className="legend-icon driver" />
            <span>Drivers</span>
          </div>
          <div className="legend-item">
            <MapPin className="legend-icon customer" />
            <span>Customers</span>
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="dashboard-view">
      <div className="metrics-grid">
        <MetricCard 
          icon={TrendingUp} 
          title="Active Deliveries" 
          value={metrics.activeDeliveries}
          colorClass="metric-blue"
        />
        <MetricCard 
          icon={Clock} 
          title="Pending Orders" 
          value={metrics.pendingOrders}
          colorClass="metric-yellow"
        />
        <MetricCard 
          icon={Truck} 
          title="Drivers Online" 
          value={metrics.driversOnline}
          colorClass="metric-purple"
        />
        <MetricCard 
          icon={CheckCircle} 
          title="Completed Today" 
          value={metrics.completedToday}
          colorClass="metric-green"
        />
      </div>

      {/* Statistics Tables */}
      <div className="stats-grid">
        <div className="stats-table-container">
          <h2 className="section-title">Order Statistics</h2>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Count</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Today</td>
                <td>{statistics.ordersToday}</td>
                <td>
                  <span className="trend-indicator trend-up">
                    ↑ {statistics.ordersToday > 0 ? 'Active' : 'None'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-medium">This Week</td>
                <td>{statistics.ordersThisWeek}</td>
                <td>
                  <span className="trend-indicator trend-up">
                    ↑ {statistics.ordersThisWeek > 0 ? `${statistics.ordersThisWeek} orders` : 'None'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-medium">This Month</td>
                <td>{statistics.ordersThisMonth}</td>
                <td>
                  <span className="trend-indicator trend-neutral">
                    → {statistics.ordersThisMonth} total
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-medium">All Time</td>
                <td>{statistics.totalOrders}</td>
                <td>
                  <span className="trend-indicator trend-neutral">
                    Total Orders
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="stats-table-container">
          <h2 className="section-title">Inventory & Resources</h2>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Total</th>
                <th>Added This Month</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Products</td>
                <td>{statistics.totalProducts}</td>
                <td>
                  <span className="trend-indicator trend-up">
                    +{statistics.productsAdded}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Vendors</td>
                <td>{statistics.totalVendors}</td>
                <td>
                  <span className="trend-indicator trend-up">
                    +{statistics.vendorsAdded}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Vehicles</td>
                <td>{statistics.totalVehicles}</td>
                <td>
                  <span className="trend-indicator trend-up">
                    +{statistics.vehiclesAdded}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Active Drivers</td>
                <td>{metrics.driversOnline}</td>
                <td>
                  <span className="trend-indicator trend-neutral">
                    Online Now
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Line Chart - Order Trend */}
        <div className="chart-container">
          <h2 className="section-title">Order Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.orderTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '0.875rem' }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Order Status Distribution */}
        <div className="chart-container">
          <h2 className="section-title">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Weekly Orders */}
        <div className="chart-container">
          <h2 className="section-title">Orders This Week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.weeklyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '0.875rem' }}
              />
              <Bar 
                dataKey="orders" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
                name="Orders"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DeliveryMap />

      <div className="card">
        <div className="card-header">
          <h2 className="section-title">Active Deliveries</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Driver</th>
                <th>ETA</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No active deliveries at the moment
                  </td>
                </tr>
              ) : (
                activeDeliveries.map((delivery) => (
                  <tr key={delivery.orderId}>
                    <td className="font-medium">{delivery.orderNumber}</td>
                    <td>{delivery.customerName}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(delivery.status)}`}>
                        {delivery.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{delivery.driverId || 'N/A'}</td>
                    <td>{formatTime(delivery.estimatedArrival)}</td>
                    <td className="text-muted">{formatElapsedTime(delivery.createdAt)}</td>
                    <td>
                      <button 
                        onClick={() => handleUpdateStatus(delivery.orderId, 'delivered')}
                        className="btn-link"
                      >
                        Mark Delivered
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Pending Orders</h2>
          </div>
          <div className="card-body">
            {orders.filter(o => o.status === 'pending').length === 0 ? (
              <p className="empty-state">No pending orders</p>
            ) : (
              orders.filter(o => o.status === 'pending').map((order) => (
                <div key={order._id} className="order-item">
                  <div className="order-info">
                    <p className="font-medium">{order.orderId}</p>
                    <p className="text-small">{order.customerId?.shopName || 'Unknown Customer'}</p>
                    <p className="text-tiny text-muted">{formatElapsedTime(order.createdAt)}</p>
                  </div>
                  <button 
                    onClick={() => handleAssignDriver(order._id)}
                    className="btn-primary btn-small"
                  >
                    Assign Driver
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="section-title">Driver Status</h2>
          </div>
          <div className="card-body">
            {drivers.length === 0 ? (
              <p className="empty-state">No drivers online</p>
            ) : (
              drivers.map((driver) => (
                <div key={driver.member} className="driver-item">
                  <div className="driver-info-wrapper">
                    <div className="driver-avatar">
                      <Truck className="icon" />
                    </div>
                    <div className="driver-details">
                      <p className="font-medium">{driver.member}</p>
                      <p className="text-tiny text-muted">
                        {driver.coordinates ? `${driver.coordinates[1].toFixed(4)}, ${driver.coordinates[0].toFixed(4)}` : 'Location unavailable'}
                      </p>
                    </div>
                  </div>
                  <span className="status-badge status-online">online</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="section-title">All Orders</h2>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td className="font-medium">{order.orderId}</td>
                  <td>{order.customerId?.shopName || 'Unknown'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.driverId || 'N/A'}</td>
                  <td className="text-muted">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const DriversView = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="section-title">Driver Management</h2>
      </div>
      <div className="card-body">
        {drivers.length === 0 ? (
          <p className="empty-state">No drivers available</p>
        ) : (
          drivers.map((driver) => (
            <div key={driver.member} className="driver-card">
              <div className="driver-info-wrapper">
                <div className="driver-avatar-large">
                  <Truck className="icon-large" />
                </div>
                <div className="driver-details">
                  <p className="font-medium">{driver.member}</p>
                  <p className="text-tiny text-muted">
                    Location: {driver.coordinates ? `${driver.coordinates[1].toFixed(4)}, ${driver.coordinates[0].toFixed(4)}` : 'N/A'}
                  </p>
                </div>
              </div>
              <span className="status-badge status-online">online</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="section-title">Product Inventory</h2>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Amount</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-state">No products found</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td className="font-medium">{product.productName}</td>
                  <td>{product.productAmount}</td>
                  <td>R{product.productCost}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const VendorsView = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="section-title">Vendor Management</h2>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Shop Name</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="2" className="empty-state">No vendors found</td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor._id}>
                  <td className="font-medium">{vendor.shopName}</td>
                  <td>
                    {vendor.location?.coordinates ? 
                      `${vendor.location.coordinates[1].toFixed(4)}, ${vendor.location.coordinates[0].toFixed(4)}` : 
                      'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const VehiclesView = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="section-title">Vehicle Management</h2>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>VIN</th>
              <th>Name</th>
              <th>Type</th>
              <th>Make</th>
              <th>Model</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">No vehicles found</td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td className="font-medium">{vehicle.VIN}</td>
                  <td>{vehicle.name}</td>
                  <td>{vehicle.type}</td>
                  <td>{vehicle.make}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.year}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="error-container">
          <div className="error-content">
            <AlertCircle className="error-icon" />
            <p className="error-text">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Navbar />
      
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-title-wrapper">
              <Package className="header-icon" />
              <h1 className="header-title">Delivery Management</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="live-indicator">
              <div className="pulse-dot"></div>
              <span className="live-text">Live Updates Active</span>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'drivers', label: 'Drivers', icon: Truck },
              { id: 'vehicles', label: 'Vehicles', icon: Navigation },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'vendors', label: 'Vendors', icon: MapPin }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'drivers' && <DriversView />}
          {activeTab === 'vehicles' && <VehiclesView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'vendors' && <VendorsView />}
        </main>
      </div>
    </div>
  );
};

export default Home;