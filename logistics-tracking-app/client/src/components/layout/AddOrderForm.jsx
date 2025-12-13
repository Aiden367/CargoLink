// OrderDeliverySystem.jsx - COMPLETE VERSION
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { Package, Truck, MapPin, CheckCircle, UserPlus } from "lucide-react";
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const WAREHOUSE = { lat: -33.92, lng: 18.42 };
const API_BASE_URL = 'http://localhost:5000';

axios.defaults.baseURL = API_BASE_URL;
const token = localStorage.getItem('token') || '';
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const createIcon = (color, emoji) => L.icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/><text x="20" y="26" font-size="18" text-anchor="middle">${emoji}</text></svg>`)}`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const warehouseIcon = createIcon("#10b981", "🏭");
const customerIcon = createIcon("#ef4444", "📍");
const driverIcon = createIcon("#3b82f6", "🚗");

export default function OrderDeliverySystem() {
  const [view, setView] = useState("create");
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    shopName: "", address: "", latitude: -33.95, longitude: 18.45
  });

  const [newDriver, setNewDriver] = useState({
    name: "", phoneNumber: "", VehicleId: ""
  });

  const [newOrder, setNewOrder] = useState({
    customerId: "", items: "", notes: ""
  });

  const [manualAssign, setManualAssign] = useState({
    orderId: "", driverId: ""
  });

  useEffect(() => {
    fetchCustomers();
    fetchOrders();
    fetchDrivers();
    fetchVehicles();

    const interval = setInterval(() => {
      fetchOrders();
      fetchDrivers();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get('/customer/GetAllCustomers');
      setCustomers(data.map(c => ({
        id: c._id,
        shopName: c.shopName,
        address: c.address,
        lat: c.location.coordinates[1],
        lng: c.location.coordinates[0]
      })));
    } catch (err) {
      console.error('Error fetching customers:', err);
      if (err.response?.status === 401) setCustomers([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/order/GetAllOrders');
      setOrders(data.map(o => ({
        id: o._id,
        orderId: o.orderId,
        customerId: o.customerId?._id,
        customerName: o.customerId?.shopName || 'Unknown',
        customerLocation: {
          lat: o.customerLocation?.coordinates[1] || 0,
          lng: o.customerLocation?.coordinates[0] || 0
        },
        driverId: o.driverId || null,
        items: o.shipmentDetails?.items || [],
        notes: o.shipmentDetails?.notes || '',
        status: o.status,
        createdAt: new Date(o.createdAt),
        actualDeliveryTime: o.actualDeliveryTime ? new Date(o.actualDeliveryTime) : null,
        driverLocation: o.driverLocation
      })));
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 404) setOrders([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data } = await axios.get('/driver/GetAllDrivers');
      setDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      if (err.response?.status === 404) setDrivers([]);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data } = await axios.get('/vehicle/GetAllVehicles');
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      if (err.response?.status === 401) setVehicles([]);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.shopName || !newCustomer.address) {
      alert("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post('/customer/AddCustomer', newCustomer);
      alert('Customer added successfully!');
      setNewCustomer({ shopName: "", address: "", latitude: -33.95, longitude: 18.45 });
      await fetchCustomers();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.phoneNumber) {
      alert("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post('/driver/AddDriver', newDriver);
      alert('Driver added successfully!');
      setNewDriver({ name: "", phoneNumber: "", VehicleId: "" });
      await fetchDrivers();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customerId || !newOrder.items) {
      alert("Select customer and enter items");
      return;
    }
    setLoading(true);
    try {
      const customer = customers.find(c => c.id === newOrder.customerId);
      const { data } = await axios.post('/order/CreateOrder', {
        customerId: newOrder.customerId,
        deliveryAddress: customer.address,
        shipmentDetails: {
          items: newOrder.items.split(",").map(i => i.trim()),
          notes: newOrder.notes
        }
      });

      const message = data.driver
        ? `Order created! Driver assigned ${data.driver.distance}km away`
        : 'Order created! Waiting for available driver';
      alert(message);

      setNewOrder({ customerId: "", items: "", notes: "" });
      await fetchOrders();
      setView("orders");
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!manualAssign.orderId || !manualAssign.driverId) {
      alert("Select both order and driver");
      return;
    }
    setLoading(true);
    try {
      await axios.post('/order/AssignDriver', {
        orderId: manualAssign.orderId,
        driverId: manualAssign.driverId
      });
      alert('Driver assigned successfully!');
      setManualAssign({ orderId: "", driverId: "" });
      await fetchOrders();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const trackOrder = async (order) => {
    setSelectedOrder(order);
    setView("tracking");

    try {
      const { data } = await axios.get(`/order/GetOrderTracking/${order.id}`);

      if (data.driverLocation) {
        setSelectedOrder({
          ...order,
          driverLocation: data.driverLocation,
          estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : null
        });
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    }
  };

  const cardStyle = { backgroundColor: '#374151', borderRadius: '12px', padding: '20px', marginBottom: '20px' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#1f2937', color: 'white', fontSize: '14px', marginBottom: '12px' };
  const btnStyle = (disabled, color = '#3b82f6') => ({ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: disabled ? '#4b5563' : color, color: 'white', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer' });

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      <div style={{ width: '450px', backgroundColor: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>📦 Delivery System</div>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>Full Database Integration</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setView("create")} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: view === "create" ? '#3b82f6' : '#374151', color: 'white' }}>Create</button>
            <button onClick={() => setView("orders")} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: view === "orders" ? '#3b82f6' : '#374151', color: 'white' }}>Orders ({orders.length})</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {view === "create" && (
            <>
              {/* Add Customer */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} /> Add Customer
                </h2>
                <input type="text" placeholder="Shop Name" value={newCustomer.shopName} onChange={(e) => setNewCustomer({ ...newCustomer, shopName: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Address" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} style={inputStyle} />
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input type="number" step="0.0001" placeholder="Lat" value={newCustomer.latitude} onChange={(e) => setNewCustomer({ ...newCustomer, latitude: parseFloat(e.target.value) })} style={{ ...inputStyle, marginBottom: 0 }} />
                  <input type="number" step="0.0001" placeholder="Lng" value={newCustomer.longitude} onChange={(e) => setNewCustomer({ ...newCustomer, longitude: parseFloat(e.target.value) })} style={{ ...inputStyle, marginBottom: 0 }} />
                </div>
                <button onClick={handleAddCustomer} disabled={loading} style={btnStyle(loading, '#10b981')}>{loading ? 'Adding...' : 'Add Customer'}</button>
              </div>

              {/* Add Driver */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={20} /> Add Driver
                </h2>
                <input type="text" placeholder="Driver Name" value={newDriver.name} onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Phone Number" value={newDriver.phoneNumber} onChange={(e) => setNewDriver({ ...newDriver, phoneNumber: e.target.value })} style={inputStyle} />
                <select value={newDriver.VehicleId} onChange={(e) => setNewDriver({ ...newDriver, VehicleId: e.target.value })} style={inputStyle}>
                  <option value="">Select Vehicle (Optional)</option>
                  {vehicles.map(v => <option key={v._id} value={v._id}>{v.name} - {v.make} {v.model}</option>)}
                </select>
                <button onClick={handleAddDriver} disabled={loading} style={btnStyle(loading, '#8b5cf6')}>{loading ? 'Adding...' : 'Add Driver'}</button>
              </div>

              {/* Create Order */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} /> Create Order
                </h2>
                <select value={newOrder.customerId} onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })} style={inputStyle}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.shopName} - {c.address}</option>)}
                </select>
                <input type="text" placeholder="Items (comma separated)" value={newOrder.items} onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })} style={inputStyle} />
                <textarea placeholder="Notes..." value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} />
                <button onClick={handleCreateOrder} disabled={!newOrder.customerId || !newOrder.items || loading} style={btnStyle(!newOrder.customerId || !newOrder.items || loading)}>{loading ? 'Creating...' : 'Create & Auto-Assign'}</button>
              </div>

              {/* Manual Driver Assignment */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={20} /> Assign Driver Manually
                </h2>
                <select value={manualAssign.orderId} onChange={(e) => setManualAssign({ ...manualAssign, orderId: e.target.value })} style={inputStyle}>
                  <option value="">Select Order</option>
                  {orders.filter(o => !o.driverId || o.status === 'pending').map(o => (
                    <option key={o.id} value={o.id}>{o.orderId} - {o.customerName}</option>
                  ))}
                </select>
                <select value={manualAssign.driverId} onChange={(e) => setManualAssign({ ...manualAssign, driverId: e.target.value })} style={inputStyle}>
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d._id} value={d.DriverId}>{d.name} ({d.DriverId})</option>)}
                </select>
                <button onClick={handleManualAssign} disabled={!manualAssign.orderId || !manualAssign.driverId || loading} style={btnStyle(!manualAssign.orderId || !manualAssign.driverId || loading, '#f59e0b')}>{loading ? 'Assigning...' : 'Assign Driver'}</button>
              </div>

              {/* Available Drivers */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>All Drivers ({drivers.length})</h3>
                <div>
                  {drivers.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center' }}>No drivers yet</p>
                  ) : (
                    drivers.map(d => (
                      <div key={d._id} style={{ padding: '8px', backgroundColor: '#1f2937', borderRadius: '6px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '500' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{d.DriverId} • {d.phoneNumber}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {view === "orders" && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>All Orders</h2>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px' }}>📦</div>
                  <p style={{ color: '#9ca3af' }}>No orders yet</p>
                </div>
              ) : (
                orders.map(o => (
                  <div key={o.id} onClick={() => trackOrder(o)} style={{ ...cardStyle, cursor: 'pointer', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{o.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{o.orderId}</div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', backgroundColor: o.status === 'delivered' ? '#10b981' : o.status === 'pending' ? '#f59e0b' : '#3b82f6' }}>{o.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#d1d5db' }}>
                      <p>🚗 {o.driverId || 'Unassigned'}</p>
                      <p>📦 {o.items.join(", ")}</p>
                      <p>🕐 {o.createdAt.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {view === "tracking" && selectedOrder && (
            <>
              <button onClick={() => setView("orders")} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#374151', color: 'white', cursor: 'pointer', marginBottom: '20px' }}>← Back</button>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Order Tracking</h2>
                {[
                  ['Order', selectedOrder.orderId],
                  ['Customer', selectedOrder.customerName],
                  ['Driver', selectedOrder.driverId || 'Unassigned'],
                  ['Items', selectedOrder.items.join(", ")]
                ].map(([label, value]) => (
                  <div key={label} style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #4b5563', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9ca3af' }}>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
                <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #4b5563', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Status</span>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', backgroundColor: selectedOrder.status === 'delivered' ? '#10b981' : '#3b82f6' }}>{selectedOrder.status.replace('_', ' ')}</span>
                </div>
                {selectedOrder.notes && (
                  <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #4b5563' }}>
                    <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Notes</div>
                    <div>{selectedOrder.notes}</div>
                  </div>
                )}
                {selectedOrder.actualDeliveryTime && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> Delivered {selectedOrder.actualDeliveryTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[WAREHOUSE.lat, WAREHOUSE.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[WAREHOUSE.lat, WAREHOUSE.lng]} icon={warehouseIcon}>
            <Popup><strong>Warehouse</strong></Popup>
          </Marker>
          {customers.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcon}>
              <Popup><strong>{c.shopName}</strong><br />{c.address}</Popup>
            </Marker>
          ))}
          {orders.filter(o => o.driverLocation).map(o => (
            <Marker key={o.id} position={[o.driverLocation.latitude, o.driverLocation.longitude]} icon={driverIcon}>
              <Popup><strong>{o.driverId}</strong><br />{o.status}</Popup>
            </Marker>
          ))}
        </MapContainer>

        <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(31,41,55,0.95)', color: 'white', padding: '16px', borderRadius: '12px', minWidth: '200px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Statistics</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Package size={16} />
            <span>Total: {orders.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Truck size={16} />
            <span>Active: {orders.filter(o => o.status === 'in_transit' || o.status === 'assigned').length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            <span>Delivered: {orders.filter(o => o.status === 'delivered').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}