import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import SPLoader from "./spinnerloader";
import "./Admin.css";
import logo from "../assets/maindash.svg";
import { Squash } from "hamburger-react";

function OrderAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      const ordersRef = collection(db, "orders");
      const ordersSnap = await getDocs(ordersRef);
      const ordersList = ordersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersList);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  // Handle deleting an order
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      await deleteDoc(doc(db, "orders", id));
      setOrders(orders.filter((order) => order.id !== id));
    }
  };

  // Navigation for tabs
  const handleTabChange = (tab) => {
    switch (tab) {
      case "menu":
        navigate("/admin");
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
          <div
            className="navbar-buttons"
            style={{ marginTop: "20px", marginRight: "-150px" }}
          >
            <button
              onClick={() => handleTabChange("menu")}
              className="nav-link"
            >
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
            <button
              onClick={() => navigate("/walkinclient")}
              className="nav-link"
            >
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
                    onClick={() => console.log("Payment Details")}
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

      <div className="orders-content">
        <h2>Orders Management</h2>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.item}</td>
                <td>{order.quantity}</td>
                <td>{order.status}</td>
                <td>
                  <button
                    className="btn edit-button"
                    onClick={() => console.log("Edit order", order.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn delete-button"
                    onClick={() => handleDelete(order.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderAdmin;
