import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase/firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import SPLoader from "./spinnerloader";
import { FaCamera, FaShoppingCart } from "react-icons/fa";
import "./onlineclient.css";
import "./userprofile.css";
import logo from "../assets/maindash.svg";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./myorders.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '@fortawesome/fontawesome-free/css/all.min.css';





function OnlineClient() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuItem, setMenuItem] = useState({
    name: "",
    stock: "",
    price: "",
    image: null,
  });
  const [menuItems, setMenuItems] = useState([]);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const increaseButtonLock = useRef({}); // For tracking individual item locks
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [showProfile, setShowProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedData, setEditedData] = useState({});
  const fileInputRef = useRef(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [activeTab, setActiveTab] = useState("foodMenu");
  const navigate = useNavigate();
  const [completedOrderHistory, setCompletedOrderHistory] = useState([]);
  const [cancelledOrderHistory, setCancelledOrderHistory] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [gcashNumber, setGcashNumber] = useState("");
  const [qrCodeImage, setQRCodeImage] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);

  

  


  useEffect(() => {
    const fetchGcashDetails = async () => {
      try {
        const docRef = doc(db, "paymentDetails", "default");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGcashNumber(data.number); // Set the fetched GCash number
          setQRCodeImage(data.image); // Fetch QR code image URL
        }
      } catch (error) {
        console.error("Error fetching GCash details: ", error);
      }
    };
  
    if (showPaymentModal) {
      fetchGcashDetails();
    }
  }, [showPaymentModal, db]);

  const handleCheckout = () => {
    setUserData(userData); // userData contains logged-in user's details
    setShowPaymentModal(true); // Show the payment modal
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false); // Hide the payment modal
  };






  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowProfile(false); // Close profile when navigating
  };

  // Retain the existing authentication useEffect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.error("No such document!");
        }
        // Fetch menu items after fetching user data
        fetchMenuItems();
      } else {
        navigate("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const [mutedNotifications, setMutedNotifications] = useState(() => {
    const storedMuted = localStorage.getItem('mutedNotifications');
    try {
      return storedMuted ? JSON.parse(storedMuted) : {}; // Default to an empty object
    } catch (error) {
      console.error("Error parsing mutedNotifications:", error);
      return {}; // Fallback in case of a parse error
    }
  });

  // Updated function to track muted notifications
const updateMutedNotifications = (orderId, status) => {
  setMutedNotifications((prev) => {
    const updated = { ...prev, [orderId]: status };
    localStorage.setItem('mutedNotifications', JSON.stringify(updated)); // Save to localStorage
    return updated;
  });
};


// Update the useEffect to maintain existing functionality
useEffect(() => {
  if (userData) {
    let unsubscribeCompletedOrders = null;
    let unsubscribeCancelledOrders = null;

    try {
      const completedOrdersRef = collection(db, 'successfulOrders');
      const completedOrdersQuery = query(completedOrdersRef, where("userId", "==", userData.uid));

      const cancelledOrdersRef = collection(db, 'cancelledOrders');
      const cancelledOrdersQuery = query(cancelledOrdersRef, where("userId", "==", userData.uid));

      // Real-time listener for completed orders
      unsubscribeCompletedOrders = onSnapshot(completedOrdersQuery, (snapshot) => {
        const completedOrders = snapshot.docs.map((doc) => {
          const data = doc.data();
          const processedOrder = {
            id: doc.id,
            ...data,
            status: 'Completed',
            items: data.items || [],
            orderTotal: data.orderTotal || data.totalAmount || 0,
            orderDate: data.orderDate || new Date().toISOString(),
            orderFinishedDate: data.orderDateFinished || data.orderFinishedDate || data.orderDate || new Date().toISOString(),
          };

          // Notify user if status has changed
          const previousStatus = localStorage.getItem(`orderStatus-${processedOrder.id}`);
          if (previousStatus !== 'Completed') {
            notifyOrderStatus(processedOrder); // Notify user
            localStorage.setItem(`orderStatus-${processedOrder.id}`, 'Completed'); // Update status
          }

          return processedOrder;
        });

        // Sort completed orders by the finished date, newest first
        completedOrders.sort((a, b) => new Date(b.orderFinishedDate) - new Date(a.orderFinishedDate));
        setCompletedOrderHistory(completedOrders);
      });

      // Real-time listener for cancelled orders
      unsubscribeCancelledOrders = onSnapshot(cancelledOrdersQuery, (snapshot) => {
        const cancelledOrders = snapshot.docs.map((doc) => {
          const data = doc.data();
          const processedOrder = {
            id: doc.id,
            ...data,
            status: 'Cancelled',
            items: data.items || [],
            orderTotal: data.orderTotal || data.totalAmount || 0,
            orderDate: data.orderDate || new Date().toISOString(),
            orderCancelledDate: data.orderDateCancelled || data.orderCancelledDate || data.orderDate || new Date().toISOString(),
          };

          // Check if the notification for this order has already been triggered
          const previousStatus = localStorage.getItem(`orderStatus-${processedOrder.id}`);
          if (previousStatus !== 'Cancelled' && !mutedNotifications[processedOrder.id]) {
            notifyOrderStatus(processedOrder, true); // Notify user
            localStorage.setItem(`orderStatus-${processedOrder.id}`, 'Cancelled'); // Update status
            updateMutedNotifications(processedOrder.id, 'Cancelled'); // Update muted notifications state
          }

          return processedOrder;
        });

        // Sort cancelled orders by the cancellation date, newest first
        cancelledOrders.sort((a, b) => new Date(b.orderCancelledDate) - new Date(a.orderCancelledDate));

        // Prevent duplicates and update the cancelled order history
        setCancelledOrderHistory((prevCancelledOrders) => {
          const newCancelledOrders = cancelledOrders.filter(
            (newOrder) => !prevCancelledOrders.some((order) => order.id === newOrder.id)
          );
          return [...prevCancelledOrders, ...newCancelledOrders]; // Append only new orders
        });
      });
    } catch (error) {
      console.error("Error setting up listeners:", error);
    }

    // Cleanup listeners on unmount or user change
    return () => {
      if (unsubscribeCompletedOrders) unsubscribeCompletedOrders();
      if (unsubscribeCancelledOrders) unsubscribeCancelledOrders();
    };
  }
}, [userData, mutedNotifications]);








// Helper function for showing order notifications
const notifyOrderStatus = (order, isCancellation = false) => {
  const itemNames = order.items && Array.isArray(order.items)
    ? order.items.map((item) => `${item.quantity}x ${item.foodName}`).join(', ')
    : 'No items';

  const notificationConfig = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  };

  // If it's a cancellation, only show the cancellation toast
  if (isCancellation) {
    toast.error(`Order Cancelled: ${itemNames}`, notificationConfig);
    return;
  }

  switch (order.status) {
    case null: // Treat null status as Pending
    case 'Pending':
      toast.info(`Order Pending: ${itemNames}`, notificationConfig);
      break;
    case 'Preparing':
      toast.warning(`Order Preparing: ${itemNames}`, notificationConfig);
      break;
    case 'Ready for Pickup':
      toast.success(`Order Ready for Pickup: ${itemNames}`, notificationConfig);
      break;
    case 'Completed':
      toast.success(`Order Completed: ${itemNames}`, notificationConfig);
      break;
    default:
      console.warn(`Unhandled order status: ${order.status}`);
      break;
  }
};





  






  // Fetch menu items from Firestore
  const fetchMenuItems = async () => {
    const menuItemsRef = collection(db, 'menuItems');
  
    // Listen for real-time updates to the menuItems collection
    const unsubscribe = onSnapshot(menuItemsRef, (snapshot) => {
      const items = snapshot.docs
        .map((doc) => ({ _id: doc.id, ...doc.data() }))
        .filter((item) => item.stock > 0);  // Only include items with stock greater than 0
      setMenuItems(items); // Update menuItems state in real-time
    });
  
    // Return the unsubscribe function to stop listening when the component unmounts
    return () => unsubscribe();
  };

  // Add item to cart
  const addToCart = async (item) => {
    if (isUpdating) return; // Prevent multiple clicks

    if (item.stock <= 0) {
      alert("Sorry, this item is out of stock.");
      return;
    }

    setIsUpdating(true); // Disable further updates

    try {
      // Decrease stock in Firestore
      const menuItemRef = doc(db, "menuItems", item._id);
      const menuItemSnap = await getDoc(menuItemRef);
      const currentStock = menuItemSnap.data().stock;

      if (currentStock > 0) {
        await updateDoc(menuItemRef, {
          stock: currentStock - 1, // Update stock in Firestore
        });

        // Update the cart locally
        setCartItems((prevItems) => {
          const itemInCart = prevItems.find(
            (cartItem) => cartItem._id === item._id
          );
          if (itemInCart) {
            return prevItems.map((cartItem) =>
              cartItem._id === item._id
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            );
          } else {
            return [...prevItems, { ...item, quantity: 1 }];
          }
        });

        // Update local menu items state
        setMenuItems((prevItems) =>
          prevItems.map((menuItem) =>
            menuItem._id === item._id
              ? { ...menuItem, stock: currentStock - 1 }
              : menuItem
          )
        );
      } else {
        alert("Item is out of stock!");
      }
    } catch (error) {
      console.error("Error adding item to cart: ", error);
    } finally {
      setIsUpdating(false); // Re-enable updates
    }
  };

  // Increase quantity of an item in the cart
  const increaseQuantity = async (itemId) => {
    const item = cartItems.find((cartItem) => cartItem._id === itemId);

    if (!item || isUpdating || increaseButtonLock.current[itemId]) return; // Prevent concurrent updates

    // Set the lock for this item
    increaseButtonLock.current[itemId] = true;
    setIsUpdating(true);

    try {
      // Optimistically update the cart UI
      setCartItems((prevItems) =>
        prevItems.map((cartItem) =>
          cartItem._id === itemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );

      // Fetch the latest stock from Firestore
      const menuItemRef = doc(db, "menuItems", itemId);
      const menuItemSnap = await getDoc(menuItemRef);
      const currentStock = menuItemSnap.data().stock;

      if (currentStock > 0) {
        // Decrease stock in Firestore
        await updateDoc(menuItemRef, {
          stock: currentStock - 1,
        });

        // Update local menu items state with updated stock value
        setMenuItems((prevItems) =>
          prevItems.map((menuItem) =>
            menuItem._id === itemId
              ? { ...menuItem, stock: currentStock - 1 }
              : menuItem
          )
        );
      } else {
        alert("Item is out of stock!");
        // Revert the optimistic UI update if no stock
        setCartItems((prevItems) =>
          prevItems.map((cartItem) =>
            cartItem._id === itemId
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          )
        );
      }
    } catch (error) {
      console.error("Error updating quantity: ", error);
      // Revert the UI change in case of an error
      setCartItems((prevItems) =>
        prevItems.map((cartItem) =>
          cartItem._id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      );
      alert("Failed to update item quantity. Please try again.");
    } finally {
      // Unlock after operation is complete
      increaseButtonLock.current[itemId] = false;
      setIsUpdating(false);
    }
  };

  // Decrease quantity of an item in the cart
  const decreaseQuantity = async (itemId) => {
    const item = cartItems.find((cartItem) => cartItem._id === itemId);

    if (item) {
      if (item.quantity > 1) {
        // Decrease the quantity if more than 1
        setCartItems((prevItems) =>
          prevItems.map((cartItem) =>
            cartItem._id === itemId
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          )
        );

        // Fetch the latest stock from Firestore
        const menuItemRef = doc(db, "menuItems", itemId);
        const menuItemSnap = await getDoc(menuItemRef);
        const currentStock = menuItemSnap.data().stock;

        // Restore stock in Firestore
        await updateDoc(menuItemRef, {
          stock: currentStock + 1, // Use the latest stock from Firestore
        });

        // Update local menu items state with the correct stock value
        setMenuItems((prevItems) =>
          prevItems.map((menuItem) =>
            menuItem._id === itemId
              ? { ...menuItem, stock: currentStock + 1 }
              : menuItem
          )
        );
      } else {
        // If quantity is 1, remove the item from the cart
        setCartItems((prevItems) =>
          prevItems.filter((cartItem) => cartItem._id !== itemId)
        );

        // Fetch the latest stock from Firestore
        const menuItemRef = doc(db, "menuItems", itemId);
        const menuItemSnap = await getDoc(menuItemRef);
        const currentStock = menuItemSnap.data().stock;

        // Restore stock in Firestore
        await updateDoc(menuItemRef, {
          stock: currentStock + 1, // Use the latest stock from Firestore
        });

        // Update local menu items state with the correct stock value
        setMenuItems((prevItems) =>
          prevItems.map((menuItem) =>
            menuItem._id === itemId
              ? { ...menuItem, stock: currentStock + 1 }
              : menuItem
          )
        );
      }
    }
  };

  // Calculate total price of items in the cart
  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Save cart details to Firestore on checkout
    const handleSubmit= async (event) => {
      event.preventDefault(); // Prevent default form submission behavior

      if (cartItems.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      // Get values from the input fields
      const studentId = document.querySelector('input[name="studentId"]').value.trim();
      const referenceNumber = document.querySelector('input[name="referenceNumber"]').value.trim();
      const amountSent = parseFloat(document.querySelector('input[name="amountSent"]').value);
      const gcashReceipt = document.querySelector('input[name="gcashReceipt"]').files[0]; // Get the uploaded file
      const orderTotal = getTotalPrice();
      
      // Validation
        if (!studentId || !referenceNumber || !gcashReceipt) {
          alert("Please fill in all the required fields and upload the receipt.");
          return;
        }

        if (isNaN(amountSent)) {
          alert("Please enter a valid amount sent.");
          return;
        }

        if (amountSent !== orderTotal) {
          alert(`The amount sent (Php ${amountSent.toFixed(2)}) must match the total price (Php ${orderTotal.toFixed(2)}).`);
          return;
        }

        try {
          // Upload receipt to Firebase Storage
          const storageRef = ref(storage, `gcashReceipts/${Date.now()}-${gcashReceipt.name}`);
          const snapshot = await uploadBytes(storageRef, gcashReceipt);
          const receiptUrl = await getDownloadURL(snapshot.ref);
      
          // Construct the order object
          const order = {
            userId: userData.uid,
            userName: userData.name,
            items: cartItems.map((item) => ({
              foodName: item.name,
              price: item.price,
              quantity: item.quantity,
              totalPrice: item.price * item.quantity,
            })),
            orderTotal: getTotalPrice(),
            orderDate: new Date().toISOString(),
            status: null, // Add status field and set to null
            assignTo: null, // Add assignTo field and set to null
            paymentDetails: {
              studentId,
              referenceNumber,
              amountSent,
              receiptUrl, // Add receipt URL
            },
          };
      
          await addDoc(collection(db, "orders"), order);
          alert("Order placed successfully!");
          setCartItems([]); // Clear the cart after successful checkout
          closePaymentModal(); // Close the payment modal if applicable
        } catch (error) {
          console.error("Error placing order: ", error);
          alert("Failed to place order. Please try again.");
        }
      };
  


  // Function to handle canceling the order
  const cancelOrder = async () => {
    // Restore stock locally and in Firestore
    for (const item of cartItems) {
      const menuItemRef = doc(db, "menuItems", item._id);

      // Fetch the current stock from Firestore
      const menuItemSnap = await getDoc(menuItemRef);
      const currentStock = menuItemSnap.data().stock;

      // Update the stock by adding back the item.quantity
      await updateDoc(menuItemRef, {
        stock: currentStock + item.quantity, // Use the latest stock from Firestore
      });

      // Update local menu items state
      setMenuItems((prevItems) =>
        prevItems.map((menuItem) =>
          menuItem._id === item._id
            ? { ...menuItem, stock: currentStock + item.quantity }
            : menuItem
        )
      );
    }

    // Clear the cart
    setCartItems([]);
  };

  // Filtered menu items based on search query
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  //new code

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  const openEditModal = () => {
    setEditedData({ ...userData });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const handleSave = async () => {
    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, editedData);
      setUserData(editedData);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating user data: ", error);
    }
  };

  const handleChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Upload image to Firebase Storage
        const storageRef = ref(storage, `profilePics/${userData.uid}`);
        await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Update user document in Firestore
        const userRef = doc(db, "users", userData.uid);
        await updateDoc(userRef, { profilePic: downloadURL });

        // Update local state
        setUserData((prevData) => ({ ...prevData, profilePic: downloadURL }));

        alert("Profile picture updated successfully!");
      } catch (error) {
        console.error("Error uploading profile picture: ", error);
        alert("Failed to update profile picture. Please try again.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };
  


  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.oldPassword
      );

      // Reauthenticate user
      await reauthenticateWithCredential(user, credential);

      // Change password
      await updatePassword(user, passwordData.newPassword);

      alert("Password changed successfully!");
      closeChangePasswordModal();
    } catch (error) {
      console.error("Error changing password: ", error);
      alert(
        "Failed to change password. Please check your old password and try again."
      );
    }
  };

  const handleLogout = () => {
    const userConfirmed = window.confirm("Are you sure you want to log out?");
    if (userConfirmed) {
      auth.signOut();
    }
  };

  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  const [showCancelledOrders, setShowCancelledOrders] = useState(false);

  // Function to toggle the visibility of Completed Orders
  const toggleCompletedOrders = () => {
    setShowCompletedOrders(prevState => !prevState);
  };

  // Function to toggle the visibility of Cancelled Orders
  const toggleCancelledOrders = () => {
    setShowCancelledOrders(prevState => !prevState);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // State for search inputs
  const [completedOrdersSearch, setCompletedOrdersSearch] = useState('');
  const [cancelledOrdersSearch, setCancelledOrdersSearch] = useState('');

  // Search filtering function for completed orders
  const filteredCompletedOrders = useMemo(() => {
    if (!completedOrderHistory) return [];
    
    return completedOrderHistory.filter(order => {
      const searchTerm = completedOrdersSearch.toLowerCase();
      
      // Search across order details
      return order.items.some(item => 
        (item.name || item.foodName || 'Unknown').toLowerCase().includes(searchTerm) ||
        formatDate(order.orderDate).toLowerCase().includes(searchTerm) ||
        (item.price && item.price.toString().includes(searchTerm)) ||
        (item.quantity && item.quantity.toString().includes(searchTerm))
      );
    });
  }, [completedOrderHistory, completedOrdersSearch]);

  // Search filtering function for cancelled orders
  const filteredCancelledOrders = useMemo(() => {
    if (!cancelledOrderHistory) return [];
    
    return cancelledOrderHistory.filter(order => {
      const searchTerm = cancelledOrdersSearch.toLowerCase();
      
      // Search across order details
      return order.items.some(item => 
        (item.name || item.foodName || 'Unknown').toLowerCase().includes(searchTerm) ||
        formatDate(order.orderDate).toLowerCase().includes(searchTerm) ||
        (item.price && item.price.toString().includes(searchTerm)) ||
        (item.quantity && item.quantity.toString().includes(searchTerm))
      );
    });
  }, [cancelledOrderHistory, cancelledOrdersSearch]);
  

  // Component for Food Menu 
  const FoodMenu = () => (
    <>
      <div className="online-search">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        autoFocus
      />
      </div>

      <div className="client-menu-container">
        <div className="client-menu-items">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
              <div key={item._id} className="client-menu-item">
                <img
                  src={item.image || "placeholder.png"}
                  alt={item.name}
                  className="client-menu-item-image"
                />
                <h3>{item.name}</h3>
                <p className="stock">Stock: {item.stock}</p>
                <p className="price">Price: Php {item.price.toFixed(2)}</p>
                <div className="client-button-container">
                  <button
                    onClick={() => addToCart(item)}
                    className="client-btn add-button"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No items match your search.</p>
          )}
        </div>
        <div className="cart-summary">
          <h2>Order Summary</h2>
          {cartItems.length === 0 ? (
            <p className="empty-cart-msg">
              Your cart is empty. Add some items!
            </p>
          ) : (
            <ul>
              {cartItems.map((item) => (
                <li key={item._id} className="cart-item">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">
                    Php {(item.price * item.quantity).toFixed(2)}
                  </span>
                  <span className="cart-item-quantity">
                    <button onClick={() => decreaseQuantity(item._id)}>
                      -
                    </button>
                    {item.quantity}
                    <button onClick={() => increaseQuantity(item._id)}>
                      {" "}
                      +
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="total-price">Total: Php {getTotalPrice().toFixed(2)}</p>
          <div className="cart-buttons">
            <button className="checkout-btn" onClick={handleCheckout}>
              Checkout
            </button>
            <button className="cancel-btn" onClick={cancelOrder}>
              Cancel Order
            </button>
          </div>
          
        </div>
      </div>
    </>
  );


  
  const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
  
    const updateMutedNotifications = (orderId, status) => {
      setMutedNotifications((prev) => {
        const updated = { ...prev, [orderId]: status };
        localStorage.setItem('mutedNotifications', JSON.stringify(updated));
        return updated;
      });
    };
  
    useEffect(() => {
      if (!userData) return;
  
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', userData.uid));
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          orderDate: doc.data().orderDate || new Date().toISOString(),
        }));
  
        const updatedOrders = [];
        fetchedOrders.forEach((order) => {
          const mutedStatus = mutedNotifications[order.id];
          if (mutedStatus !== order.status) {
            notifyOrderStatus(order); // Trigger notification for the new status
            updateMutedNotifications(order.id, order.status); // Update muted status
          }
          updatedOrders.push(order);
        });
  
        // Sort orders by orderDate in descending order (latest orders first)
        updatedOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  
        // Update the orders state to reflect the latest data
        setOrders(updatedOrders);
      });
  
      return () => unsubscribe();
    }, [userData, mutedNotifications]);
  
    const cancelOrder = async () => {
      try {
        const orderToTransfer = orders.find((order) => order.id === orderToCancel);
        if (!orderToTransfer) {
          console.error('Order not found for cancellation.');
          return;
        }
  
        notifyOrderStatus(orderToTransfer, true); // Notify cancellation
        updateMutedNotifications(orderToTransfer.id, 'Cancelled'); // Mute the canceled status
  
        const orderDoc = doc(db, 'orders', orderToCancel);
        await updateDoc(orderDoc, { status: 'Cancelled' });
        await addDoc(collection(db, 'cancelledOrders'), orderToTransfer);
        await deleteDoc(orderDoc);
  
        // Remove the canceled order from the orders state
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderToCancel));
        setShowCancelModal(false);
        setOrderToCancel(null);
      } catch (error) {
        console.error('Error canceling order:', error);
      }
    };
  
    const formatDate = (dateString) => {
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return new Date(dateString).toLocaleDateString('en-US', options);
    };
  
    // Render status badge based on order status
    const renderStatusBadge = (status) => {
      const statusClasses = {
        'Pending': 'my-orders-status-pending',
        'Preparing': 'my-orders-status-preparing',
        'Ready for Pickup': 'my-orders-status-ready',
        'Completed': 'my-orders-status-completed',
        'Cancelled': 'my-orders-status-canceled',
      };
      return (
        <div className={`my-orders-status-badge ${statusClasses[status] || ''}`}>
          {status}
        </div>
      );
    };
  
    // Handle cancel modal display
    const openCancelModal = (studentId) => {
      setOrderToCancel(studentId);
      setShowCancelModal(true);
    };
  
    const closeCancelModal = () => {
      setShowCancelModal(false);
      setOrderToCancel(null);
    };
  
    const filteredOrders = orders.filter((order) =>
      order.items.some((item) => item.foodName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
    return (
      <div className="my-orders-container">
        <div className="my-orders-header">
          <h2 className="my-orders-title">Current Orders</h2>
          <div className="my-orders-search-container">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="my-orders-search-input"
            />
          </div>
        </div>
  
        {filteredOrders.length === 0 ? (
          <div className="my-orders-no-orders">
            <p>There are no orders...</p>
          </div>
        ) : (
          <div className="my-orders-table-container">
            <table className="my-orders-table">
              <thead>
                <tr>
                  <th>Order Date</th>
                  <th>Items</th>
                  <th>Quantity</th>
                  <th>Price per Item</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className="my-orders-cancel-header">Cancel Order</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    {order.items.map((item, itemIndex) => (
                      <tr
                        key={`${order.id}-${itemIndex}`}
                        className={`order-row ${
                          itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''
                        }`}
                      >
                        {itemIndex === 0 && (
                          <td
                            rowSpan={order.items.length}
                            className={`my-orders-date ${
                              itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''
                            }`}
                          >
                            {formatDate(order.orderDate)}
                          </td>
                        )}
                        <td className="my-orders-food-name">{item.foodName}</td>
                        <td className="my-orders-quantity">{item.quantity}</td>
                        <td className="my-orders-price">₱{item.price.toFixed(2)}</td>
                        {itemIndex === 0 && (
                          <td
                            rowSpan={order.items.length}
                            className={`my-orders-total-amount ${
                              itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''
                            }`}
                          >
                            ₱{order.orderTotal.toFixed(2)}
                          </td>
                        )}
                        {itemIndex === 0 && (
                          <td rowSpan={order.items.length} className="my-orders-status">
                            {renderStatusBadge(order.status || 'Pending')}
                          </td>
                        )}
                        {itemIndex === 0 && (
                          <td rowSpan={order.items.length} className="my-orders-cancel">
                            {(order.status === 'Pending' || order.status === null) && (
                              <button
                                className="my-orders-cancel-button"
                                onClick={() => openCancelModal(order.id)}
                              >
                                X
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
  
        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="my-orders-cancel-modal">
            <div className="my-orders-cancel-modal-content">
              <h3>Are you sure you want to cancel this order?</h3>
              <button
                className="my-orders-cancel-confirm"
                onClick={cancelOrder}
              >
                Yes, Cancel
              </button>
              <button
                className="my-orders-cancel-cancel"
                onClick={closeCancelModal}
              >
                No, Keep Order
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  
  
  
  




  


  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
    <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <nav className="navbar">
        <div className="navbar-logo">
          <a href="/onlineclient">
            <img
              src={logo}
              className="App-verylog"
              alt="WildBites Logo"
              style={{
                width: "550px",
                height: "auto",
                marginRight: "7%",
                marginTop: "0px",
              }}
            />
          </a>
          <div
            className="client-navbar-buttons"
            style={{ marginTop: "20px", marginRight: "150px" }}
          >
            <button
              onClick={() => handleTabChange("foodMenu")}
              className={`nav-link ${activeTab === "foodMenu" ? "active" : ""}`}
            >
              Food Menu
            </button>
            <button
              onClick={() => handleTabChange("myOrders")}
              className={`nav-link ${activeTab === "myOrders" ? "active" : ""}`}
            >
              My Orders
            </button>
            
          </div>
        </div>

        <div className="navbar-actions">
          <div className="user-profile" onClick={toggleProfile}>
            {userData?.profilePic ? (
              <img
                src={userData.profilePic}
                alt="Profile"
                className="profile-pic"
              />
            ) : (
              <div className="initials-circle">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <button className="btn cart-btn" aria-label="View Cart">
            <FaShoppingCart size={20} />
          </button>
        </div>
      </nav>

    

      {showProfile ? (
  <div className="user-profile-container">
    <div className="profile-content">
      {/* Profile Picture */}
      <div className="profile-picture">
        {userData?.profilePic ? (
          <img src={userData.profilePic} alt="Profile" />
        ) : (
          <div className="modal-initials-circle">
            {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
          </div>
        )}
        <div className="camera-icon" onClick={triggerFileInput}>
          <FaCamera />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleProfilePicChange}
          style={{ display: "none" }}
          accept="image/*"
        />
      </div>

      {/* Profile Details */}
      <div className="profile-details">
        <div className="profile-header">
          <h2>{userData?.name || "Test"}</h2>
          <div className="profile-actions">
            <button onClick={openEditModal} className="edit-btn">
              Edit Info
            </button>
            <button onClick={openChangePasswordModal} className="change-password-btn">
              Change Password
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="user-info">
          {/* First Row: Course/Year and Contact Number */}
          <div className="info-row">
            <div className="info-field">
              <label htmlFor="course">Course/Year</label>
              <input
                id="course"
                type="text"
                value={userData?.course || ""}
                readOnly
              />
            </div>
            <div className="info-field">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                id="contactNumber"
                type="text"
                value={userData?.contactNumber || ""}
                readOnly
              />
            </div>
          </div>

          {/* Second Row: School ID Number and Email */}
          <div className="info-row">
            <div className="info-field">
              <label htmlFor="schoolId">School ID Number</label>
              <input
                id="schoolId"
                type="text"
                value={userData?.schoolId || ""}
                readOnly
              />
            </div>
            <div className="info-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={userData?.email || ""}
                readOnly
              />
            </div>
          </div>
        </div>

      {/* Completed Orders Section */}
      <div className="my-orders-completed">
        <div className="my-orders-header">
          <h3 className="my-orders-title-completed">
            Completed Orders
            <button
              className="my-orders-toggle-btn"
              onClick={toggleCompletedOrders}
            >
              <i className={`my-orders-eye-icon ${showCompletedOrders ? 'my-orders-eye-open' : 'my-orders-eye-closed'}`} />
            </button>
          </h3>
          
          {/* Search Input */}
          <div className="my-orders-search-container">
            <input
              type="text"
              placeholder="Search completed orders..."
              className="my-orders-search-input"
              value={completedOrdersSearch}
              onChange={(e) => setCompletedOrdersSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="my-orders-table-container">
          {showCompletedOrders ? (
            filteredCompletedOrders.length > 0 ? (
              <table className="my-orders-table">
                <thead>
                  <tr>
                    <th>Order Date</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total Price</th>
                    <th className="my-orders-status-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompletedOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      {order.items.map((item, itemIndex) => (
                        <tr
                          key={`${order.id}-${itemIndex}`}
                          className={`order-row ${itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''}`}
                        >
                          {itemIndex === 0 && (
                            <td
                              rowSpan={order.items.length}
                              className={`my-orders-date ${itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''}`}
                            >
                              {formatDate(order.orderDate)}
                            </td>
                          )}
                          <td className="my-orders-food-name">{item.name || item.foodName || 'Unknown'}</td>
                          <td className="my-orders-quantity">{item.quantity || 0}</td>
                          <td className="my-orders-price">Php {(item.price || 0).toFixed(2)}</td>
                          {itemIndex === 0 && (
                            <td
                              rowSpan={order.items.length}
                              className={`my-orders-total-amount ${itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''}`}
                            >
                              Php {(item.price * item.quantity || 0).toFixed(2)}
                            </td>
                          )}
                          {itemIndex === 0 && (
                            <td rowSpan={order.items.length} className="my-orders-status">
                              <span className="my-orders-status-badge my-orders-status-completed">
                                Completed
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="my-orders-no-orders">
                {completedOrdersSearch 
                  ? `No orders found matching "${completedOrdersSearch}"` 
                  : "No completed orders found"}
              </div>
            )
          ) : null}
        </div>
      </div>

      {/* Cancelled Orders Section (Similar structure) */}
      <div className="my-orders-canceled">
        <div className="my-orders-header">
          <h3 className="my-orders-title-canceled">
            Cancelled Orders
            <button
              className="my-orders-toggle-btn"
              onClick={toggleCancelledOrders}
            >
              <i className={`my-orders-eye-icon ${showCancelledOrders ? 'my-orders-eye-open' : 'my-orders-eye-closed'}`} />
            </button>
          </h3>
          
          {/* Search Input */}
          <div className="my-orders-search-container">
            <input
              type="text"
              placeholder="Search cancelled orders..."
              className="my-orders-search-input"
              value={cancelledOrdersSearch}
              onChange={(e) => setCancelledOrdersSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="my-orders-table-container">
          {showCancelledOrders ? (
            filteredCancelledOrders.length > 0 ? (
              <table className="my-orders-table">
                <thead>
                  <tr>
                    <th>Order Date</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total Price</th>
                    <th className="my-orders-status-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCancelledOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      {order.items.map((item, itemIndex) => (
                        <tr
                          key={`${order.id}-${itemIndex}`}
                          className={`order-row ${itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''}`}
                        >
                          {itemIndex === 0 && (
                            <td
                              rowSpan={order.items.length}
                              className={`my-orders-date ${itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''}`}
                            >
                              {formatDate(order.orderDate)}
                            </td>
                          )}
                          <td className="my-orders-food-name">{item.name || item.foodName || 'Unknown'}</td>
                          <td className="my-orders-quantity">{item.quantity || 0}</td>
                          <td className="my-orders-price">Php {(item.price || 0).toFixed(2)}</td>
                          {itemIndex === 0 && (
                            <td
                              rowSpan={order.items.length}
                              className={`my-orders-total-amount ${itemIndex === order.items.length - 1 ? 'my-orders-last-item' : ''}`}
                            >
                              Php {(item.price * item.quantity || 0).toFixed(2)}
                            </td>
                          )}
                          {itemIndex === 0 && (
                            <td rowSpan={order.items.length} className="my-orders-status">
                              <span className="my-orders-status-badge my-orders-status-canceled">
                                Cancelled
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="my-orders-no-orders">
                {cancelledOrdersSearch 
                  ? `No orders found matching "${cancelledOrdersSearch}"` 
                  : "No cancelled orders found"}
              </div>
            )
          ) : null}
        </div>
      </div>


      </div>
    </div>
  </div>
) : (
  <>
    {/* Conditional Rendering for Tabs */}
    {activeTab === "foodMenu" && <FoodMenu />}
    {activeTab === "myOrders" && <MyOrders />}
  </>
)}


{showEditModal && (
  <div className="modal-overlay">
    <div className="edit-modal">
      <h3>Edit Profile</h3>
      <div className="edit-form">
        <div className="form-group">
          <label>Full Name</label>
          <input name="name" value={editedData.name || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Course/Year</label>
          <input name="course" value={editedData.course || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>School ID Number</label>
          <input name="schoolId" value={editedData.schoolId || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Contact Number</label>
          <input name="contactNumber" value={editedData.contactNumber || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input name="email" value={editedData.email || ''} onChange={handleChange} />
        </div>
      </div>
      <div className="modal-actions">
        <button onClick={handleSave} className="save-btn">Save</button>
        <button onClick={closeEditModal} className="cancel-btn">Cancel</button>
      </div>
    </div>
  </div>
)}

{showChangePasswordModal && (
  <div className="modal-overlay">
    <div className="change-password-modal">
      <h3>Change Password</h3>
      <div className="change-password-form">
        <div className="form-group">
          <label>Old Password</label>
          <input 
            type="password" 
            name="oldPassword" 
            value={passwordData.oldPassword} 
            onChange={handlePasswordChange} 
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input 
            type="password" 
            name="newPassword" 
            value={passwordData.newPassword} 
            onChange={handlePasswordChange} 
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input 
            type="password" 
            name="confirmPassword" 
            value={passwordData.confirmPassword} 
            onChange={handlePasswordChange} 
          />
        </div>
      </div>
      <div className="modal-actions">
        <button onClick={handleChangePassword} className="save-btn">Change Password</button>
        <button onClick={closeChangePasswordModal} className="cancel-btn">Cancel</button>
      </div>
    </div>
  </div>
)}



{showPaymentModal && (
  <div className="payment-modal-overlay">
    <div className="payment-modal">
      <h2 className="payment-title">Payment Portal</h2>
      <div className="payment-landscape">
        {/* Left: Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          {cartItems.length === 0 ? (
    <p>Your cart is empty. Add some items!</p>
  ) : (
    <ul>
      {cartItems.map((item) => (
        <li key={item._id} className="cart-item">
          <span className="cart-item-name">{item.name}</span>
          <span className="cart-item-quantity">Qty: {item.quantity}</span>
          <span className="cart-item-price">
            Php {(item.price * item.quantity).toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  )}
  <p className="total-price">Total: Php {getTotalPrice().toFixed(2)}</p>  
        </div>

        {/* Right: GCash Information and Form */}
        <div className="gcash-section">
          <div className="gcash-info">
            <h3>GCash Information</h3>
            <p>GCash Name: Wildcats Food Express</p>
            <p>
              GCash Number:{" "}
              <span
                className="gcash-number"
                onClick={() => {
                  navigator.clipboard.writeText(gcashNumber);
                  alert("GCash number copied to clipboard!");
                }}
                style={{ cursor: "pointer", color: "blue" }}
              >
                {gcashNumber}
              </span>
            </p>
          </div>
          <div className="qr-code-container">
              <h4>QR Code</h4>
              {qrCodeImage && (
                <img
                  src={qrCodeImage}
                  alt="GCash QR Code"
                  className="gcash-qr-code"
                    onClick={(e) => {
                      // Prevent the default anchor link behavior
                      e.preventDefault();
              
                      // Open the QR code image in a new tab without navigating away from the current page
                      window.open(qrCodeImage, '_blank'); // Open in a new tab
              
                      // Create an invisible link to trigger the download
                      const link = document.createElement('a');
                      link.href = qrCodeImage;
                      link.download = 'GCash-QR-Code.png'; // Set the download file name
                      link.click(); // Trigger the download
                  }}
                />
              )}
            </div>
          <form className="payment-form">
          <label>
              Student ID:
              <input
                type="text"
                name="studentId"
                value={userData.schoolId || ''}
                readOnly
              />
            </label>
            <label>
              Reference Number:
              <input
                type="text"
                name="referenceNumber"
                placeholder="Enter Reference Number"
              />
            </label>
            <label>
              Amount Sent:
              <input
                type="number"
                name="amountSent"
                placeholder="Enter Amount Sent"
              />
            </label>
            <label>
              GCash Receipt:
              <input
                type="file"
                name="gcashReceipt"
                accept="image/*"
              />
            </label>

            {/* Buttons Container */}
            <div className="button-container">
              <button type="submit" className="submit-button-payment" onClick={handleSubmit}>
                Submit Payment
              </button>
              <button type="button" className="cancel-btn-payment" onClick={closePaymentModal}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
)}


    </div>
  );
}

export default OnlineClient;
