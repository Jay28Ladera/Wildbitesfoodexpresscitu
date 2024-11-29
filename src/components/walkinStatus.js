import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/maindash.svg";
import "./walkinStatus.css";
import { FaShoppingCart } from "react-icons/fa";

function WalkinOrderStatus() {
  const navigate = useNavigate();

  // State declarations
  const [walkinClients, setWalkinClients] = useState({
    pending: [],
    preparing: [],
    readyForPickup: [],
  });
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [userRolesModalOpen, setUserRolesModalOpen] = useState(false);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchWalkinClients = async () => {
      try {
        const db = getFirestore();
        const walkinClientsCollection = collection(db, "walkinClients");
        const snapshot = await getDocs(walkinClientsCollection);

        const clients = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Organize clients by status
        const groupedClients = {
          pending: clients.filter(
            (client) => client.orderStatus === "Pending"
          ),
          preparing: clients.filter(
            (client) => client.orderStatus === "Preparing"
          ),
          readyForPickup: clients.filter(
            (client) => client.orderStatus === "Ready for Pickup"
          ),
        };

        // Sort clients by priority number (chronologically)
        const sortPriorityNumbers = (clients) => {
          return clients.sort((a, b) => {
            const priorityA = parseInt(a.priorityNumber.slice(1)); // Remove 'C' and parse as number
            const priorityB = parseInt(b.priorityNumber.slice(1));
            return priorityA - priorityB; // Ascending order
          });
        };

        // Apply sorting
        setWalkinClients({
          pending: sortPriorityNumbers(groupedClients.pending),
          preparing: sortPriorityNumbers(groupedClients.preparing),
          readyForPickup: sortPriorityNumbers(groupedClients.readyForPickup),
        });
      } catch (error) {
        console.error("Error fetching walk-in clients:", error);
      }
    };

    fetchWalkinClients();
  }, []);

  // Modal control functions
  const openUserRolesModal = () => setUserRolesModalOpen(true);
  const closeUserRolesModal = () => setUserRolesModalOpen(false);
  const openCartModal = () => setCartModalOpen(true);
  const closeCartModal = () => setCartModalOpen(false);

  const handleChangeToAdmin = () => {
    closeUserRolesModal();
    navigate("/admin");
  };

  const handleChangeToWalkinClient = () => {
    navigate("/walkinclient");
  };

  const calculateTotalItemsInCart = () => {
    return 0; // Placeholder logic
  };

  return (
    <div className="WalkinOrderStatus">
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
            style={{
              marginTop: "20px",
              marginRight: "-150px",
              position: "relative",
            }}
          >
            
            <button className="BacktoAdmin" onClick={openUserRolesModal}>Go to Admin</button>
            <button className="walkinClient" onClick={handleChangeToWalkinClient}>Walk-in Client</button>
          </div>
        </div>

        {userRolesModalOpen && (
          <div className="modaluser-role">
            <div className="modal-contentuser-role">
              <h2>User Roles</h2>
              <p>Would you like to change this user role to Admin?</p>
              <div className="button-container">
                <button
                  className="cancel-btn-roles"
                  onClick={closeUserRolesModal}
                >
                  Cancel
                </button>
                <button
                  className="change-btn-roles"
                  onClick={handleChangeToAdmin}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Order Status Table */}
      <div className="order-status-content">
        <h1>Order Status</h1>
        <table className="status-table">
          <thead>
            <tr>
              <th>Pending</th>
              <th>Preparing</th>
              <th>Ready for Pickup</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Pending Column */}
              <td>
                {walkinClients.pending.map((client) => (
                  <div key={client.id}>
                    {client.orderStatus !== "Completed" && client.priorityNumber}
                  </div>
                ))}
              </td>

              {/* Preparing Column */}
              <td>
                {walkinClients.preparing.map((client) => (
                  <div key={client.id}>
                    {client.orderStatus !== "Completed" && client.priorityNumber}
                  </div>
                ))}
              </td>

              {/* Ready for Pickup Column */}
              <td>
                {walkinClients.readyForPickup.map((client) => (
                  <div key={client.id}>
                    {client.orderStatus !== "Completed" && client.priorityNumber}
                  </div>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WalkinOrderStatus;
