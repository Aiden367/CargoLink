import '../../styles/SearchForVehicle.css';
const SearchForVendors = ({ vendors }) => {
    // Safety check: ensure vehicles is always an array
    const vendorList = Array.isArray(vendors) ? vendors : [];
    return (
        <div>
           <table>
                <thead>
                    <tr>
                        <th>Vendor ID</th>
                        <th>Shop Name</th>
                        <th>Longitude</th>
                        <th>Latitude</th>
                    </tr>
                </thead>
                <tbody>
                    {vendorList.length > 0 ? (
                        vendorList.map((vendor) => (
                            <tr key={vendor.vendorId}>
                                <td>{vendor.vendorId}</td>
                                <td>{vendor.shopName}</td>
                                <td>{vendor.location.latitude}</td>
                                <td>{vendor.location.longitude}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6">No vendors found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default SearchForVendors