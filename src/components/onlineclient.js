import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase/firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowProfile(false); // Close profile when navigating
  };

  // Track authentication state and fetch user data
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

  // Fetch menu items from Firestore
  const fetchMenuItems = async () => {
    const menuItemsRef = collection(db, "menuItems");
    const menuItemsSnap = await getDocs(menuItemsRef);
    const items = menuItemsSnap.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));
    setMenuItems(items);
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
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

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
    };

    try {
      await addDoc(collection(db, "orders"), order);
      alert("Order placed successfully!");
      setCartItems([]); // Clear the cart after successful checkout
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
  const filteredMenuItems = menuItems.filter(
    (item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) // Case-insensitive match
  );

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
  

  // Component for Food Menu 
  const FoodMenu = () => (
    <>
      <div className="online-search">
        <input
          type="text"
          placeholder="Search for food..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
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

  // Component for My Orders
  const MyOrders = () => {
    // Implement actual MyOrders logic here
    return (
      <div>
        <h2>My Orders</h2>
      </div>
    );
  };

  // Component for Payment
  const Payment = () => {
    // Implement actual payment logic here
    return (
      <div>
        <h2>Payment</h2>
      </div>
    );
  };

  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
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
            <button
              onClick={() => handleTabChange("payment")}
              className={`nav-link ${activeTab === "payment" ? "active" : ""}`}
            >
              Payment
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
                  <button
                    onClick={openChangePasswordModal}
                    className="change-password-btn"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="logout-btn"
                  >
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
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeTab === "foodMenu" && <FoodMenu />}
          {activeTab === "myOrders" && <MyOrders />}
          {activeTab === "payment" && <Payment />}
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


    </div>
  );
}

export default OnlineClient;
