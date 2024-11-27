import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import SPLoader from "./spinnerloader";
import Navbar from "./Navbar";
import NotificationComponent from "./NotificationComponent";
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
  const [notification, setNotification] = useState(null); // Notification state
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

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

    const unsubscribe = onSnapshot(
      ordersRef,
      async (snapshot) => {
        const ordersList = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();

            // Trigger notification for online orders with status null
            if (orderType === "online" && data.status === null) {
              const studentID = data.paymentDetails?.studentId || "Unknown";
              setNotification(
                `New online order received! Order ID: ${studentID}`
              );
              const orderDoc = doc(db, collectionName, docSnapshot.id);
              await updateDoc(orderDoc, { status: "Pending" });
            }

            // Trigger notification for walk-in orders with orderStatus null
            if (orderType === "walkin" && data.orderStatus === null) {
              const priorityNumber = data.priorityNumber || "Unknown";
              setNotification(
                `New walk-in order received! Order ID: ${priorityNumber}`
              );
              const orderDoc = doc(db, collectionName, docSnapshot.id);
              await updateDoc(orderDoc, { orderStatus: "Pending" });
            }

            const date =
              orderType === "online" && data.orderDate
                ? new Date(data.orderDate)
                : data.createdAt
                ? data.createdAt.toDate()
                : null;
            const formattedDate =
              date && !isNaN(date)
                ? date.toISOString().split("T")[0].replace(/-/g, "/")
                : "N/A";

            return {
              id: docSnapshot.id,
              orderId:
                orderType === "online"
                  ? data.paymentDetails?.studentId || "N/A"
                  : data.priorityNumber || "N/A",
              name:
                orderType === "online"
                  ? data.userName || "Unknown"
                  : "Walk-in Customer",
              totalAmount: data.orderTotal || data.totalPrice || 0,
              items: data.items || data.orderItems || [],
              status: data.status || data.orderStatus || "Pending",
              assignTo: data.assignTo || data.assign || "Unassigned",
              proofOfPayment: data.paymentDetails?.receiptUrl || "N/A",
              date: formattedDate,
              timestamp: date, // For sorting
            };
          })
        );

        ordersList.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest orders first
        setOrders(ordersList);
        setFilteredOrders(ordersList); // Initialize filteredOrders
        setLoading(false);
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

      // Determine the fields to update
      const updateData =
        orderType === "online"
          ? { assignTo: assignedStaffName, status: "Preparing" } // Update 'status' for online orders
          : { assign: assignedStaffName, orderStatus: "Preparing" }; // Update 'orderStatus' for walk-in clients

      // Update the document in Firestore
      await updateDoc(orderDoc, updateData);

      console.log(
        `Assigned ${assignedStaffName} to order ${orderId} and updated status to Preparing`
      );
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
      // Fetch the original document to preserve its structure
      const orderDocRef = doc(db, collectionName, order.id);
      const orderSnapshot = await getDoc(orderDocRef);

      if (!orderSnapshot.exists()) {
        console.error("Order does not exist.");
        return;
      }

      const orderData = orderSnapshot.data(); // Get the exact document structure

      // Add the document to the target collection
      await addDoc(collection(db, targetCollection), orderData);

      // Delete the original document
      await deleteDoc(orderDocRef);

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

  const handleImageClick = (imageUrl) => {
    setCurrentImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageUrl("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "red";
      case "Preparing":
        return "yellow";
      case "Ready for Pickup":
        return "green";
      default:
        return "white"; // Default background color
    }
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
    if (orderType === type) return; // Prevent reloading if the current tab is already active
    setOrderType(type);
    setLoading(true);
    setSearchQuery(""); // Reset the search query for a fresh view
  };

  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
      <Navbar />
      {notification && (
        <NotificationComponent
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="orders-content" style={{ padding: "20px" }}>
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

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: "10px 0", padding: "6px", width: "300px" }}
        />

        <table className={`orders-table ${orderType}`}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Order ID</th>
              {orderType === "online" && <th>Name</th>} {/* Hide for Walk-In */}
              <th>Total Amount</th>
              <th>Product</th>
              <th>Status</th>
              <th>Assign</th>
              {orderType === "online" && <th>Proof of Payment</th>}{" "}
              {/* Hide for Walk-In */}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.date}</td>
                <td>{order.orderId}</td>
                {orderType === "online" && <td>{order.name}</td>}{" "}
                {/* Hide for Walk-In */}
                <td>₱{order.totalAmount}</td>
                <td>
                  {order.items.map((product, index) => (
                    <div key={index}>
                      {product.foodName || product.name} (x{product.quantity}) -
                      ₱{product.price * product.quantity}
                    </div>
                  ))}
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                    style={{
                      backgroundColor: getStatusColor(order.status), // Colored background for selected status
                      color: order.status === "Pending" ? "white" : "black", // Ensure text contrast
                    }}
                    className="status-dropdown"
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
                {orderType === "online" && (
                  <td>
                    {order.proofOfPayment !== "N/A" ? (
                      <span
                        style={{
                          color: "red",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                        onClick={() => handleImageClick(order.proofOfPayment)}
                      >
                        Click Here
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                )}{" "}
                {/* Hide for Walk-In */}
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

        {/* Image Modal */}
        {showImageModal && (
          <div className="image-modal">
            <div className="image-modal-content">
              <button className="close-button" onClick={closeImageModal}>
                X
              </button>
              <img
                src={currentImageUrl}
                alt="Proof of Payment"
                className="modal-image"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderAdmin;
