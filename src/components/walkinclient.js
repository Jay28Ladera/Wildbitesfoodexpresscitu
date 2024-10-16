import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/maindash.svg";
import './walkinclient.css';
import { collection, getDocs } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase/firebase"; // Make sure to import your Firebase setup

function WalkinClient() {
  // initiate navigate
  const navigate = useNavigate();

  // initiate state for menu items and cart
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  // initiate UserRolesModalOpen and Open and Close Modal for User Roles
  const [userRolesModalOpen, setUserRolesModalOpen] = useState(false);
  const openUserRolesModal = () => setUserRolesModalOpen(true);
  const closeUserRolesModal = () => setUserRolesModalOpen(false);

  //change to admin logic
  const handleChangeToAdmin = () => {
    closeUserRolesModal();
    navigate("/admin");
  };

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

  // Fetch menu items when component mounts
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Add item to cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id);
      if (existingItem) {
        // If the item already exists, increase the quantity
        return prevCart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Add the new item with quantity 1
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  // Remove item from cart or decrease quantity
  const removeFromCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          // If item quantity is more than 1, decrease the quantity
          return prevCart.map((cartItem) =>
            cartItem._id === item._id
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          );
        } else {
          // If item quantity is 1, remove it from the cart
          return prevCart.filter((cartItem) => cartItem._id !== item._id);
        }
      }
      return prevCart;
    });
  };

  const calculateTotalPrice = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.price * cartItem.quantity), 0);
  };
  // Open and close cart modal
  const openCartModal = () => setCartModalOpen(true);
  const closeCartModal = () => setCartModalOpen(false);

  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="WalkinClient">
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
            <button className="navbutton1">Menu</button>
            <button className="navbutton2" onClick={openCartModal}>Cart ({cart.length})</button>
            <button className="navbutton3" onClick={openUserRolesModal}>User-Roles</button>
            <button className="navbutton4" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {userRolesModalOpen && (
          <div className="modaluser-role">
            <div className="modal-contentuser-role">
              <h2>User Roles</h2>
              <p>Would you like to change this user role to Client?</p>
              <div className="button-container">
                <button className="cancel-btn-roles" onClick={closeUserRolesModal}>Cancel</button>
                <button className="change-btn-roles" onClick={handleChangeToAdmin}>Change to Admin</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Display the filtered menu items */}
      <div className="menu-items">
        {filteredMenuItems.map((item) => (
          <div key={item._id} className="menu-item">
            <img
              src={item.image || "placeholder.png"}
              alt={item.name}
              className="menu-item-image"
            />
            <h3>{item.name}</h3>
            <p className="stock">Stock: {item.stock}</p>
            <p className="price">Price: Php {item.price.toFixed(2)}</p>
            <button className="add-to-cart-button" onClick={() => addToCart(item)}>+</button>
          </div>
        ))}
      </div>

      {/* Cart Modal */}
      {cartModalOpen && (
        <div className="modal-cart">
          <div className="modal-content-cart">
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <div className="cart-items">
                {cart.map((cartItem) => (
                    <div key={cartItem._id} className="cart-item">
                        <h3>{cartItem.name}</h3>
                        <p>Total Price: Php {(cartItem.price * cartItem.quantity).toFixed(2)}</p>
                            <div className="quantity-and-buttons">
                                
                                <button className="remove-from-cart-button" onClick={() => removeFromCart(cartItem)}>-</button>
                                <p>{cartItem.quantity}</p>
                                <button className="add-to-cart-button" onClick={() => addToCart(cartItem)}>+</button>
                            </div>
                    </div>
                ))}
              </div>
            )}
            {/* Display total price */}
            {cart.length > 0 && (
              <div className="cart-total">
                <h3>Total Price: Php {calculateTotalPrice().toFixed(2)}</h3>
              </div>
            )}
            <button className="close-cart-button" onClick={closeCartModal}>Close</button>
            {cart.length > 0 && <button className="proceed-payment-button">Proceed to Payment</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default WalkinClient;
