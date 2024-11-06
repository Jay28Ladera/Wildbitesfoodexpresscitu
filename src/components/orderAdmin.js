import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import SPLoader from "./spinnerloader";
import Navbar from "./Navbar";
import "./orderAdmin.css";

function OrderAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState("online"); // For switching between tabs

  // Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersRef = collection(db, "orders");
        const ordersSnap = await getDocs(ordersRef);
        const ordersList = ordersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched Orders:", ordersList);
        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Handle switching between "Online Orders" and "Walk-in Orders"
  const handleTabChange = (type) => {
    setOrderType(type);
  };

  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
      <Navbar />
      <div
        className="orders-content"
        style={{ paddingLeft: "20px", paddingRight: "20px" }}
      >
        <h2>Today's Orders</h2>
        <div className="order-tabs">
          <button
            className={`order-tab ${
              orderType === "online" ? "active-tab" : ""
            }`}
            onClick={() => handleTabChange("online")}
          >
            Online Orders
          </button>
          <button
            className={`order-tab ${
              orderType === "walkin" ? "active-tab" : ""
            }`}
            onClick={() => handleTabChange("walkin")}
          >
            Customer Orders
          </button>
        </div>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Name</th>
              <th>Total Amount</th>
              <th>Product</th>
              <th>Status</th>
              <th>Assign</th>
              <th>Proof of Payment</th>
            </tr>
          </thead>
          <tbody>
            {orders
              .filter((order) => orderType === "online") // Show only online orders
              .map((order) => (
                <tr key={order.id}>
                  <td>{order.userId || "N/A"}</td>
                  <td>{order.userName || "Unknown"}</td>
                  <td>₱{order.orderTotal || 0}</td>
                  <td>
                    {order.items?.map((product, index) => (
                      <div key={index}>
                        {product.foodName} (x{product.quantity}) - ₱
                        {product.price * product.quantity}
                      </div>
                    ))}
                  </td>
                  <td>
                    <select
                      value={order.status || "Pending"}
                      onChange={(e) =>
                        console.log("Status changed:", e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={order.assignTo || "Unassigned"}
                      onChange={(e) =>
                        console.log("Assigned to:", e.target.value)
                      }
                    >
                      <option value="Staff A">Staff A</option>
                      <option value="Staff B">Staff B</option>
                      <option value="Staff C">Staff C</option>
                      <option value="Unassigned">Unassigned</option>
                    </select>
                  </td>
                  <td>
                    {order.proofOfPayment
                      ? `Reference #: ${order.proofOfPayment}`
                      : "Not Paid"}
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
