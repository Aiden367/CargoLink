import AddVendorForm from '../components/layout/AddVendorForm';
import Navbar from '../components/layout/navbar.jsx';
import '../styles/AddVendorPage.css';
import { useNavigate } from "react-router-dom";
const AddVendorPage = () => {
    const navigate = useNavigate();
    const backToVehicles = async (e) => {
        navigate('/vendors');
    }
    return (
        <>
            <Navbar />
            <div className="add-vendor-heading-form">
                <button onClick={backToVehicles}>Back to Vendors</button>
                <h1 className ="new-vendor-text-heading">New Vendor</h1>
            </div>
            <div className="add-vendor-form">
                <AddVendorForm />
            </div>
        </>
    )
}

export default AddVendorPage