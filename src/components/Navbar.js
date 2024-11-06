import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import logo from "../assets/maindash.svg";
import { Squash } from "hamburger-react";
import "./navbar.css";

function Navbar({
  openUserRolesModal,
  openModal,
  searchQuery,
  handleSearchChange,
}) {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    switch (tab) {
      case "menu":
        navigate("/Admin");
        break;
      case "orders":
        navigate("/orders");
        break;
      case "reports":
        navigate("/reports");
        break;
      case "userRoles":
        navigate("/walkinclient");
        break;
      default:
        break;
    }
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
          <button onClick={openUserRolesModal} className="nav-link">
            User Roles
          </button>
          <button onClick={() => handleTabChange("/")} className="nav-link">
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
                <button
                  className="btn"
                  onClick={() => navigate("/payment-details")}
                >
                  Payment Details
                </button>
              </li>
              <li className="dropdown-item">
                <button
                  className="btn logout-btn"
                  style={{ color: "red" }}
                  onClick={() => auth.signOut()}
                >
                  Log Out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
