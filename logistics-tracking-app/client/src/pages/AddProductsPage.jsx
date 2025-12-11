import AddProductForm from '../components/layout/AddProductForm';
import Navbar from '../components/layout/navbar.jsx';
import '../styles/AddProductPage.css';
import { useNavigate } from "react-router-dom";
const AddVendorPage = () => {
    const navigate = useNavigate();
    const backToVehicles = async (e) => {
        navigate('/products');
    }
    return (
        <>
            <Navbar />
            <div className="add-product-heading-form">
                <button onClick={backToVehicles}>Back to Products</button>
                <h1 className ="new-product-text-heading">New Products</h1>
            </div>
            <div className="add-product-form">
                <AddProductForm />
            </div>
        </>
    )
}

export default AddVendorPage