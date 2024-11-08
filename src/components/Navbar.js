import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase/firebase";
import logo from "../assets/maindash.svg";
import { Squash } from "hamburger-react";
import PaymentDetailsModal from "./PaymentDetailsModal"; // Import the payment modal
import "./navbar.css";

function Navbar({
  openUserRolesModal,
  openModal,
  searchQuery,
  handleSearchChange,
}) {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [userRolesModalOpen, setUserRolesModalOpen] = useState(false); // State for User Roles modal
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    switch (tab) {
      case "menu":
        navigate("/Admin");
        break;
      case "orders":
        navigate("/OrderAdmin");
        break;
      case "reports":
        navigate("/reports");
        break;
      case "userRoles":
        navigate("/walkinclient");
        break;
        case "staffManagement":
          navigate("/staffmanagement");
          break;
      default:
        break;
    }
  };

  // Open and close Payment Modal
  const openPaymentModal = () => {
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
  };

  // Open and close User Roles Modal
  const openUserRolesModalHandler = () => {
    setUserRolesModalOpen(true);
  };

  const closeUserRolesModal = () => {
    setUserRolesModalOpen(false);
  };

  // Handle changing a user's role to "Client"
  const handleChangeToClient = () => {
    closeUserRolesModal();
    navigate("/walkinclient");
  };

  // Handle logout
  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        console.log("User signed out successfully.");
        navigate("/login"); // Redirect to the login page or homepage after logout
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
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
        <div
          className="navbar-buttons"
          style={{ marginTop: "20px", marginRight: "-150px" }}
        >
          <button onClick={() => handleTabChange("menu")} className="nav-link">
            Menu
          </button>
          <button
            onClick={() => handleTabChange("orders")}
            className="nav-link"
          >
            Orders
          </button>
          <button
            onClick={() => handleTabChange("reports")}
            className="nav-link"
          >
            Reports
          </button>
          <button onClick={openUserRolesModalHandler} className="nav-link">
            User Roles
          </button>
          <button onClick={() => handleTabChange("staffManagement")} className="nav-link">
  Staff Management
</button>
        </div>
      </div>
      <div className="navbar-actions">
        <span className="admin-option">Admin</span>
        <div className="hamburger-icon">
          <Squash toggled={hamburgerOpen} toggle={setHamburgerOpen} />
        </div>

        {hamburgerOpen && (
          <div className="hamburger-menu">
            <ul className="dropdown-menu">
              <li className="dropdown-item">
                <button className="btn" onClick={openPaymentModal}>
                  Payment Details
                </button>
              </li>
              <li className="dropdown-item">
                <button
                  className="btn logout-btn"
                  style={{ color: "red" }}
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {paymentModalOpen && (
        <PaymentDetailsModal
          isOpen={paymentModalOpen}
          onClose={closePaymentModal}
          storage={storage}
          db={db}
        />
      )}

      {/* User Roles Modal */}
      {userRolesModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>User Roles</h2>
            <p>Would you like to change this user role to Client?</p>
            <div className="button-container">
              <button
                className="btn cancel-btn-roles"
                onClick={closeUserRolesModal}
              >
                Cancel
              </button>
              <button
                className="btn change-btn-roles"
                onClick={handleChangeToClient}
              >
                Change to Client
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
