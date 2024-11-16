import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import SPLoader from "./spinnerloader";
import Navbar from "./Navbar";
import Notification from "./Notification"; // Import the notification component
import "./orderAdmin.css";

function OrderAdmin() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [modalData, setModalData] = useState(null); // State for modal data
  const [notification, setNotification] = useState(null); // For notifications

  // Fetch server staff from staff collection
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffRef = collection(db, "staff");
        const staffSnapshot = await getDocs(staffRef);
        const serverStaff = staffSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((staff) => staff.role === "SERVER");
        setStaff(serverStaff);
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };

    fetchStaff();
  }, []);

  // Set up real-time listener for orders
  useEffect(() => {
    const collectionName = orderType === "online" ? "orders" : "walkinClients";
    const ordersRef = collection(db, collectionName);

    // Initialize previous orders from localStorage (optional)
    const storedPreviousOrders = JSON.parse(
      localStorage.getItem("previousOrders") || "[]"
    );
    const previousOrderSet = new Set(storedPreviousOrders);

    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const newOrdersList = snapshot.docs.map((doc) => {
          const data = doc.data();
          const date = data.createdAt ? data.createdAt.toDate() : null;
          const formattedDate =
            date && !isNaN(date)
              ? date.toISOString().split("T")[0].replace(/-/g, "/")
              : "N/A";

          return {
            id: doc.id,
            orderId:
              orderType === "online"
                ? data.userId || "N/A"
                : data.priorityNumber || "N/A",
            name:
              orderType === "online"
                ? data.userName || "Unknown"
                : "Walk-in Customer",
            totalAmount: data.orderTotal || data.totalPrice || 0,
            items: data.items || data.orderItems || [],
            status: data.status || data.orderStatus || "Pending",
            assignTo: data.assignTo || data.assign || "Unassigned",
            proofOfPayment: data.proofOfPayment || "N/A",
            date: formattedDate,
          };
        });

        // Identify newly added orders
        const newOrders = newOrdersList.filter(
          (order) => !previousOrderSet.has(order.id)
        );

        // Update notification and previousOrders
        if (newOrders.length > 0) {
          setNotification(`${newOrders.length} new order(s) added!`);
          newOrders.forEach((order) => previousOrderSet.add(order.id));
        }

        // Update state and localStorage
        setOrders(newOrdersList);
        setFilteredOrders(newOrdersList);
        setLoading(false);
        localStorage.setItem(
          "previousOrders",
          JSON.stringify(Array.from(previousOrderSet))
        );
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderType]);

  // Handle assigning staff to order
  const handleAssignStaff = async (orderId, assignedStaffName) => {
    try {
      const collectionName =
        orderType === "online" ? "orders" : "walkinClients";
      const orderDoc = doc(db, collectionName, orderId);
      const updateData =
        orderType === "online"
          ? { assignTo: assignedStaffName }
          : { assign: assignedStaffName };
      await updateDoc(orderDoc, updateData);
      console.log(`Assigned ${assignedStaffName} to order ${orderId}`);
    } catch (error) {
      console.error("Error assigning staff:", error);
    }
  };

  // Handle status change with modal confirmation for Complete and Cancel
  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === "Completed" || newStatus === "Cancelled") {
      setModalData({ order, newStatus }); // Set modal data and open modal
      setShowModal(true);
    } else {
      // Update status without confirmation for other statuses
      const collectionName =
        orderType === "online" ? "orders" : "walkinClients";
      const orderDoc = doc(db, collectionName, order.id);
      const updateData =
        orderType === "online"
          ? { status: newStatus }
          : { orderStatus: newStatus };
      await updateDoc(orderDoc, updateData);
      console.log(`Updated status of order ${order.id} to ${newStatus}`);
    }
  };

  // Confirm status change to Complete or Cancel
  const confirmStatusChange = async () => {
    const { order, newStatus } = modalData;
    const collectionName = orderType === "online" ? "orders" : "walkinClients";
    const targetCollection =
      newStatus === "Completed" ? "successfulOrders" : "cancelledOrders";

    try {
      // Add the order data to the target collection
      await addDoc(collection(db, targetCollection), { ...order });
      // Delete the order from its original collection
      await deleteDoc(doc(db, collectionName, order.id));
      console.log(`Moved order ${order.id} to ${targetCollection}`);
    } catch (error) {
      console.error("Error moving order:", error);
    } finally {
      setShowModal(false);
      setModalData(null); // Reset modal data
    }
  };

  // Cancel modal action
  const cancelStatusChange = () => {
    setShowModal(false);
    setModalData(null); // Reset modal data
  };

  // Filter orders based on search query
  useEffect(() => {
    const filtered = orders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        order.orderId.toLowerCase().includes(searchLower) ||
        order.name.toLowerCase().includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  const handleTabChange = (type) => {
    setOrderType(type);
    setLoading(true);
    setSearchQuery("");
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

        {/* Display Notification */}
        {notification && (
          <Notification
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}

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

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: "10px 0", padding: "6px", width: "300px" }}
        />

        {/* Table */}
        <table className={`orders-table ${orderType}`}>
          <thead>
            <tr>
              <th>Date</th>
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
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.date}</td>
                <td>{order.orderId}</td>
                <td>{order.name}</td>
                <td>₱{order.totalAmount}</td>
                <td>
                  {order.items.map((product, index) => (
                    <div key={index}>
                      {product.name} (x{product.quantity}) - ₱
                      {product.price * product.quantity}
                    </div>
                  ))}
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <select
                    value={order.assignTo}
                    onChange={(e) =>
                      handleAssignStaff(order.id, e.target.value)
                    }
                  >
                    <option value="Unassigned">Unassigned</option>
                    {staff.map((staffMember) => (
                      <option key={staffMember.id} value={staffMember.name}>
                        {staffMember.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{order.proofOfPayment}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Confirmation Modal */}
        {showModal && (
          <div className="orderModal-modal">
            <div className="orderModal-content">
              <h3>Order Status</h3>
              <p>Would you like to change the status of this order?</p>
              <button
                className="orderModal-cancelButton"
                onClick={cancelStatusChange}
              >
                Cancel
              </button>
              <button
                className="orderModal-confirmButton"
                onClick={confirmStatusChange}
              >
                Yes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderAdmin;
