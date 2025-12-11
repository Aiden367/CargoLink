import '../../styles/SearchForVehicle.css';
const SearchForVehicles = ({ vehicles }) => {
    // Safety check: ensure vehicles is always an array
    const vehicleList = Array.isArray(vehicles) ? vehicles : [];
    return (
        <div>
           <table>
                <thead>
                    <tr>
                        <th>VIN</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Year</th>
                        <th>Make</th>
                        <th>Model</th>
                    </tr>
                </thead>
                <tbody>
                    {vehicleList.length > 0 ? (
                        vehicleList.map((vehicle) => (
                            <tr key={vehicle.vehicleId}>
                                <td>{vehicle.VIN}</td>
                                <td>{vehicle.name}</td>
                                <td>{vehicle.type}</td>
                                <td>{vehicle.year}</td>
                                <td>{vehicle.make}</td>
                                <td>{vehicle.model}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6">No vehicles found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default SearchForVehicles