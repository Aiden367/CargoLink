import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import axios from "axios";

const driverIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
    iconSize: [32, 32],
});

export default function DriverMap() {
    const [drivers, setDrivers] = useState([]);
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const res = await axios.get("http://localhost:5000/driver/GetDriverLocations", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                    }
                });
                setDrivers(res.data);
            } catch (err) {
                console.error("Failed to fetch driver locations", err);
            }
        };

        fetchDrivers();
        const interval = setInterval(fetchDrivers, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <MapContainer 
            center={[-33.92, 18.42]} 
            zoom={12} 
            style={{ height: "100vh", width: "100vw" }}
        >
            <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />

            {drivers.map((driver, i) => (
                <Marker 
                    key={i}
                    position={[driver.coordinates[1], driver.coordinates[0]]}
                    icon={driverIcon}
                >
                    <Popup>
                        <b>Driver: {driver.member}</b><br />
                        Lat: {driver.coordinates[1].toFixed(5)} <br/>
                        Lon: {driver.coordinates[0].toFixed(5)}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
