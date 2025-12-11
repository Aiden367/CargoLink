import AddVehicleForm from '../components/layout/AddVehicleForm';
import Navbar from '../components/layout/navbar.jsx';
import '../styles/AddVehiclesPage.css';
import { useNavigate } from "react-router-dom";
const AddVehiclePage = () => {
    const navigate = useNavigate();
    const backToVehicles = async (e) => {
        navigate('/vehicles');
    }
    return (
        <>
            <Navbar />
            <div className="add-vehicles-heading-form">
                <button onClick={backToVehicles}>Back to Vehicles</button>
                <h1 className ="new-vehicle-text-heading">New Vehicle</h1>
            </div>
            <div className="add-vehicle-form">
                <AddVehicleForm />
            </div>
        </>
    )
}

export default AddVehiclePage