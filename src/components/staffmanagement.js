import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  db
} from "../firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import SPLoader from "./spinnerloader";
import "./StaffManagement.css";
import logo from "../assets/maindash.svg";
import { Squash } from "hamburger-react";
import PaymentDetailsModal from "./PaymentDetailsModal";


function StaffManagement() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [userRolesModalOpen, setUserRolesModalOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState({
    _id: "",
    id: "",
    name: "",
    role: "",
    shiftFrom: "08:00",
    shiftTo: "16:00",
  });
  const [newStaff, setNewStaff] = useState({
    id: "",
    name: "",
    role: "",
    shiftFrom: "08:00",
    shiftTo: "16:00",
  });
  
  const navigate = useNavigate();
  const saveToLocalStorage = (data) => {
    localStorage.setItem('staffData', JSON.stringify(data));
  };
  const STAFF_ROLES = [
    "CASHIER",
    "WASHER",
    "WAITER",
    "MANAGER",
    "CHEF",
    "SERVER",
    "ACCOUNTANT"
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // First try to load from localStorage
          const savedFilteredData = localStorage.getItem('filteredStaffData');
          if (savedFilteredData) {
            setFilteredStaff(JSON.parse(savedFilteredData));
          }
          
          // Then fetch fresh data regardless of user document
          fetchStaff();
          
        } catch (error) {
          console.error("Error loading data:", error);
          setError("Error loading data. Please try again.");
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredStaff(staff); // Show all data if searchQuery is empty
    } else {
      const filtered = staff.filter(
        (employee) =>
          employee.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          employee.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStaff(filtered); // Update filtered data
    }
  }, [searchQuery, staff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const staffCollection = collection(db, "staff");
      const staffQuery = query(staffCollection, orderBy("name"));
      const staffSnapshot = await getDocs(staffQuery);
      
      if (!staffSnapshot.empty) {
        const staffList = staffSnapshot.docs.map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }));
        
        setStaff(staffList);
        setFilteredStaff(staffList);
        
        // Save to localStorage
        localStorage.setItem('staffData', JSON.stringify(staffList));
        localStorage.setItem('filteredStaffData', JSON.stringify(staffList));
        setError(null);
      } else {
        setStaff([]);
        setFilteredStaff([]);
        setError("No staff data available");
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to load staff data. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, "staff", id));
        await fetchStaff(); // This will update localStorage via fetchStaff
      } catch (err) {
        setError("Failed to delete staff member");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditStaff = async () => {
    try {
      const validationError = validateStaffData(editStaff);
      if (validationError) {
        setError(validationError);
        return;
      }
  
      setLoading(true);
      await updateDoc(doc(db, "staff", editStaff._id), {
        id: editStaff.id,
        name: editStaff.name,
        role: editStaff.role,
        shiftFrom: editStaff.shiftFrom,
        shiftTo: editStaff.shiftTo,
      });
      setModalOpen(false);
      await fetchStaff(); // This will update localStorage via fetchStaff
      setError(null);
    } catch (err) {
      setError("Failed to edit staff member");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      const validationError = validateStaffData(newStaff);
      if (validationError) {
        setError(validationError);
        return;
      }
  
      setLoading(true);
      await addDoc(collection(db, "staff"), {
        id: newStaff.id,
        name: newStaff.name,
        role: newStaff.role,
        shiftFrom: newStaff.shiftFrom,
        shiftTo: newStaff.shiftTo,
      });
      setAddModalOpen(false);
      setNewStaff({ id: "", name: "", role: "", shiftFrom: "08:00", shiftTo: "16:00" });
      await fetchStaff(); // This will update localStorage via fetchStaff
      setError(null);
    } catch (err) {
      setError("Failed to add new staff member");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeToClient = () => {
    setUserRolesModalOpen(false);
    navigate("/walkinclient");
  };

  const handleTabChange = (tab) => {
    switch (tab) {
      case "menu":
        navigate("/admin");
        break;
        case "orders":
          navigate("/orderAdmin");
          break;
        break;
      case "reports":
        navigate("/reports");
        break;
      case "staffManagement":
        navigate("/staffmanagement");
        break;
      default:
        break;
    }
  };

  const validateStaffData = (staffData) => {
    if (!staffData.id.trim()) return "Employee ID is required";
    if (!staffData.name.trim()) return "Employee name is required";
    if (!staffData.role) return "Please select a role"; // Modified this line
    if (!staffData.shiftFrom || !staffData.shiftTo) return "Shift times are required";
    return null;
  };

  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-logo">
          <img
            src={logo}
            className="App-verylog"
            alt="WildBites Logo"
            style={{
              width: "650px",
              height: "auto",
              marginRight: "7%",
              marginTop: "0px",
            }}
          />
          <div className="navbar-buttons" style={{ marginTop: "20px", marginRight: "-150px" }}>
            <button onClick={() => handleTabChange("menu")} className="nav-link">
              Menu
            </button>
            <button
              onClick={() => handleTabChange("orders")}
              className="nav-link"
            >
              Orders
            </button>
            <button onClick={() => handleTabChange("reports")} className="nav-link">
              Reports
            </button>
            <button onClick={() => setUserRolesModalOpen(true)} className="nav-link">
              User Roles
            </button>
            <button onClick={() => handleTabChange("staffManagement")} className="nav-link">
              Staff Management
            </button>
          </div>
        </div>
        {userRolesModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2>User Roles</h2>
              <p>Would you like to change this user role to Client?</p>
              <div className="button-container">
                <button className="btn cancel-btn-roles" onClick={() => setUserRolesModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn change-btn-roles" onClick={handleChangeToClient}>
                  Change to Client
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="navbar-actions">
          <div className="hamburger-icon">
            <Squash toggled={hamburgerOpen} toggle={setHamburgerOpen} />
          </div>
          {hamburgerOpen && (
            <div className="hamburger-menu">
              <ul className="dropdown-menu">
                <li className="dropdown-item">
                  <button className="btn" onClick={() => setPaymentModalOpen(true)}>
                    Payment Details
                  </button>
                </li>
                <li className="dropdown-item">
                  <button className="btn logout-btn" style={{ color: "red" }} onClick={() => auth.signOut()}>
                    Log Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>
      
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <button
  onClick={() => setAddModalOpen(true)}
  className="add-staff-button"
  disabled={loading}
>
  Add Staff
</button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search staff by ID, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <table className="staff-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((employee) => (
              <tr key={employee._id}>
                <td>{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.role}</td>
                <td>
                  {employee.shiftFrom} - {employee.shiftTo}
                </td>
                <td>
                <button 
  onClick={() => { setEditStaff(employee); setModalOpen(true); }} 
  className="staff-action-button edit-button"
>
  Edit
</button>
<button 
  onClick={() => handleDeleteStaff(employee._id)} 
  className="staff-action-button delete-button"
>
  Delete
</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {addModalOpen && (
  <div className="staff-modal">
    <div className="staff-modal-content">
      <h2>Add New Staff</h2>
      <input
        type="text"
        placeholder="Employee ID"
        value={newStaff.id}
        onChange={(e) => setNewStaff({ ...newStaff, id: e.target.value })}
      />
      <input
        type="text"
        placeholder="Employee Name"
        value={newStaff.name}
        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
      />
      {/* Replace the role input with this select dropdown */}
      <select
        value={newStaff.role}
        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
        className="w-full p-2 border rounded-md mb-3"
      >
        <option value="">Select Role</option>
        {STAFF_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <input
        type="time"
        placeholder="Shift From"
        value={newStaff.shiftFrom}
        onChange={(e) => setNewStaff({ ...newStaff, shiftFrom: e.target.value })}
      />
      <input
        type="time"
        placeholder="Shift To"
        value={newStaff.shiftTo}
        onChange={(e) => setNewStaff({ ...newStaff, shiftTo: e.target.value })}
      />
      <div className="staff-modal-button-container">
        <button onClick={() => setAddModalOpen(false)} className="staff-modal-btn staff-modal-cancel-btn">
          Cancel
        </button>
        <button onClick={handleAddStaff} className="staff-modal-btn staff-modal-save-btn">
          Add Staff
        </button>
      </div>
    </div>
  </div>
)}
     {modalOpen && (
  <div className="staff-modal">
    <div className="staff-modal-content">
      <h2>Edit Staff</h2>
      <input
        type="text"
        placeholder="Employee ID"
        value={editStaff.id}
        onChange={(e) => setEditStaff({ ...editStaff, id: e.target.value })}
      />
      <input
        type="text"
        placeholder="Employee Name"
        value={editStaff.name}
        onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
      />
      {/* Replace the role input with this select dropdown */}
      <select
        value={editStaff.role}
        onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
        className="w-full p-2 border rounded-md mb-3"
      >
        <option value="">Select Role</option>
        {STAFF_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <input
        type="time"
        placeholder="Shift From"
        value={editStaff.shiftFrom}
        onChange={(e) => setEditStaff({ ...editStaff, shiftFrom: e.target.value })}
      />
      <input
        type="time"
        placeholder="Shift To"
        value={editStaff.shiftTo}
        onChange={(e) => setEditStaff({ ...editStaff, shiftTo: e.target.value })}
      />
      <div className="staff-modal-button-container">
        <button onClick={() => setModalOpen(false)} className="staff-modal-btn staff-modal-cancel-btn">
          Cancel
        </button>
        <button onClick={handleEditStaff} className="staff-modal-btn staff-modal-save-btn">
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}

      {paymentModalOpen && (
        <PaymentDetailsModal onClose={() => setPaymentModalOpen(false)} />
      )}
    </div>
  );
}

export default StaffManagement;
