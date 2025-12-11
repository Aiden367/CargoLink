import '../../styles/SearchForVehicle.css';
const SearchForProducts = ({ products }) => {
    // Safety check: ensure vehicles is always an array
    const productList = Array.isArray(products) ? products : [];
    return (
        <div>
           <table>
                <thead>
                    <tr>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>Product Amount</th>
                        <th>Product Cost</th>
                        <th>Date Product Added</th>
                        
                    </tr>
                </thead>
                <tbody>
                    {productList.length > 0 ? (
                        productList.map((product) => (
                            <tr key={product.productId}>
                                <td>{product.productId}</td>
                                <td>{product.productName}</td>
                                <td>{product.productCost}</td>
                                <td>{product.dateInventoryCreated}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6">No products found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default SearchForProducts