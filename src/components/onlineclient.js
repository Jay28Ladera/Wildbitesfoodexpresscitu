import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase/firebase';
import { doc, getDoc, deleteDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import SPLoader from './spinnerloader';
import { FaShoppingCart } from 'react-icons/fa';
import './onlineclient.css';
import logo from '../assets/maindash.svg';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function OnlineClient() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuItem, setMenuItem] = useState({
    name: '',
    stock: '',
    price: '',
    image: null,
  });
  const [menuItems, setMenuItems] = useState([]);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false); 
  const increaseButtonLock = useRef({});  // For tracking individual item locks
  const navigate = useNavigate();

  // Track authentication state and fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.error('No such document!');
        }

        // Fetch menu items after fetching user data
        fetchMenuItems();
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch menu items from Firestore
  const fetchMenuItems = async () => {
    const menuItemsRef = collection(db, 'menuItems');
    const menuItemsSnap = await getDocs(menuItemsRef);
    const items = menuItemsSnap.docs.map((doc) => ({ _id: doc.id, ...doc.data() }));
    setMenuItems(items);
  };


  const handleTabChange = (tab) => {
    switch(tab) {
      case "menu":
        navigate('/menu');
        break;
      case "orders":
        navigate('/orders');
        break;
      case "reports":
        navigate('/reports');
        break;
      case "userRoles":
        navigate('/user-roles');
        break;
      default:
        break;
    }
  };

   // Add item to cart
   const addToCart = async (item) => {
    if (isUpdating) return;  // Prevent multiple clicks
  
    if (item.stock <= 0) {
      alert("Sorry, this item is out of stock.");
      return;
    }
  
    setIsUpdating(true);  // Disable further updates
  
    try {
      // Decrease stock in Firestore
      const menuItemRef = doc(db, 'menuItems', item._id);
      const menuItemSnap = await getDoc(menuItemRef);
      const currentStock = menuItemSnap.data().stock;
  
      if (currentStock > 0) {
        await updateDoc(menuItemRef, {
          stock: currentStock - 1  // Update stock in Firestore
        });
  
        // Update the cart locally
        setCartItems(prevItems => {
          const itemInCart = prevItems.find(cartItem => cartItem._id === item._id);
          if (itemInCart) {
            return prevItems.map(cartItem =>
              cartItem._id === item._id
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            );
          } else {
            return [...prevItems, { ...item, quantity: 1 }];
          }
        });
  
        // Update local menu items state
        setMenuItems(prevItems =>
          prevItems.map(menuItem =>
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
      setIsUpdating(false);  // Re-enable updates
    }
  };

  // Increase quantity of an item in the cart
  const increaseQuantity = async (itemId) => {
    const item = cartItems.find(cartItem => cartItem._id === itemId);
  
    if (!item || isUpdating || increaseButtonLock.current[itemId]) return;  // Prevent concurrent updates
  
    // Set the lock for this item
    increaseButtonLock.current[itemId] = true;
    setIsUpdating(true);
  
    try {
      // Optimistically update the cart UI
      setCartItems(prevItems =>
        prevItems.map(cartItem =>
          cartItem._id === itemId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        )
      );
  
      // Fetch the latest stock from Firestore
      const menuItemRef = doc(db, 'menuItems', itemId);
      const menuItemSnap = await getDoc(menuItemRef);
      const currentStock = menuItemSnap.data().stock;
  
      if (currentStock > 0) {
        // Decrease stock in Firestore
        await updateDoc(menuItemRef, {
          stock: currentStock - 1
        });
  
        // Update local menu items state with updated stock value
        setMenuItems(prevItems =>
          prevItems.map(menuItem =>
            menuItem._id === itemId ? { ...menuItem, stock: currentStock - 1 } : menuItem
          )
        );
      } else {
        alert("Item is out of stock!");
        // Revert the optimistic UI update if no stock
        setCartItems(prevItems =>
          prevItems.map(cartItem =>
            cartItem._id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
          )
        );
      }
    } catch (error) {
      console.error("Error updating quantity: ", error);
      // Revert the UI change in case of an error
      setCartItems(prevItems =>
        prevItems.map(cartItem =>
          cartItem._id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
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
    const item = cartItems.find(cartItem => cartItem._id === itemId);
    
    if (item) {
      if (item.quantity > 1) {
        // Decrease the quantity if more than 1
        setCartItems(prevItems =>
          prevItems.map(cartItem =>
            cartItem._id === itemId
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          )
        );
  
        // Fetch the latest stock from Firestore
        const menuItemRef = doc(db, 'menuItems', itemId);
        const menuItemSnap = await getDoc(menuItemRef);
        const currentStock = menuItemSnap.data().stock;
  
        // Restore stock in Firestore
        await updateDoc(menuItemRef, {
          stock: currentStock + 1  // Use the latest stock from Firestore
        });
  
        // Update local menu items state with the correct stock value
        setMenuItems((prevItems) =>
          prevItems.map(menuItem =>
            menuItem._id === itemId
              ? { ...menuItem, stock: currentStock + 1 }
              : menuItem
          )
        );
      } else {
        // If quantity is 1, remove the item from the cart
        setCartItems(prevItems =>
          prevItems.filter(cartItem => cartItem._id !== itemId)
        );
  
        // Fetch the latest stock from Firestore
        const menuItemRef = doc(db, 'menuItems', itemId);
        const menuItemSnap = await getDoc(menuItemRef);
        const currentStock = menuItemSnap.data().stock;
  
        // Restore stock in Firestore
        await updateDoc(menuItemRef, {
          stock: currentStock + 1  // Use the latest stock from Firestore
        });
  
        // Update local menu items state with the correct stock value
        setMenuItems((prevItems) =>
          prevItems.map(menuItem =>
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
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
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
      items: cartItems.map(item => ({
        foodName: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity
      })),
      orderTotal: getTotalPrice(),
      orderDate: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'orders'), order);
      alert("Order placed successfully!");
      setCartItems([]);  // Clear the cart after successful checkout
    } catch (error) {
      console.error("Error placing order: ", error);
      alert("Failed to place order. Please try again.");
    }
  };

   // Function to handle canceling the order
   const cancelOrder = async () => {
    // Restore stock locally and in Firestore
    for (const item of cartItems) {
      const menuItemRef = doc(db, 'menuItems', item._id);
  
      // Fetch the current stock from Firestore
      const menuItemSnap = await getDoc(menuItemRef);
      const currentStock = menuItemSnap.data().stock;
  
      // Update the stock by adding back the item.quantity
      await updateDoc(menuItemRef, {
        stock: currentStock + item.quantity  // Use the latest stock from Firestore
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

  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-logo">
          <a href="/onlineclient"><img src={logo} className="App-verylog" alt="WildBites Logo" style={{ width: "550px", height: "auto", marginRight: "7%", marginTop: "0px"}}/></a>
          <div className="client-navbar-buttons" style={{ marginTop: "20px", marginRight: "150px" }}>
            <button onClick={() => handleTabChange("UserProfile")} className="nav-link">Food Menu</button>
            <button onClick={() => handleTabChange("orders")} className="nav-link">My Orders</button>
            <button onClick={() => handleTabChange("reports")} className="nav-link">Payment</button>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="user-profile">
            {userData?.profilePic ? (
              <img src={userData.profilePic} alt="Profile" className="profile-pic" />
            ) : (
              <div className="initials-circle">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="user-name">{userData?.name}</span>
          </div>

          <button className="btn cart-btn" aria-label="View Cart">
            <FaShoppingCart size={20} />
          </button>

          <button className="btn logout-btn" onClick={() => auth.signOut()}>Log Out</button>
        </div>
      </nav>

      <div className="client-menu-container">
        <div className="client-menu-items">
          {menuItems.map(item => (
            <div key={item._id} className="client-menu-item">
              <img src={item.image || 'placeholder.png'} alt={item.name} className="client-menu-item-image" />
              <h3>{item.name}</h3>
              <p className="stock">Stock: {item.stock}</p>
              <p className="price">Price: Php {item.price.toFixed(2)}</p>
              <div className="client-button-container">
                <button onClick={() => addToCart(item)} className="client-btn add-button">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          {cartItems.length === 0 ? (
            <p className="empty-cart-msg">Your cart is empty. Add some items!</p>
          ) : (
            <ul>
              {cartItems.map((item) => (
                <li key={item._id} className="cart-item">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">
                    Php {(item.price * item.quantity).toFixed(2)}
                  </span>
                  <span className="cart-item-quantity">
                    <button onClick={() => decreaseQuantity(item._id)}>-</button>
                    {item.quantity}
                    <button onClick={() => increaseQuantity(item._id)}>+</button>
                  </span>

                </li>
              ))}
            </ul>
          )}
          <p className="total-price">Total: Php {getTotalPrice().toFixed(2)}</p>
          <div className="cart-buttons">
            <button className="checkout-btn">Checkout</button>
            <button className="cancel-btn" onClick={cancelOrder}>Cancel Order</button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default OnlineClient;
