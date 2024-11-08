import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/maindash.svg";
import './walkinclient.css';
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { FaShoppingCart } from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore"; // import updateDoc to update documents in Firestore

function WalkinClient() {
  const navigate = useNavigate();

  // State declarations
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [userRolesModalOpen, setUserRolesModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false); // For the receipt modal
  const [receiptContent, setReceiptContent] = useState(null); // Store order details for receipt
  const [searchQuery, setSearchQuery] = useState('');

  // Modal control functions
  const openUserRolesModal = () => setUserRolesModalOpen(true);
  const closeUserRolesModal = () => setUserRolesModalOpen(false);
  const openCartModal = () => setCartModalOpen(true);
  const closeCartModal = () => setCartModalOpen(false);
  
  const closeReceiptModal = () => {
    // Print the receipt content without the close button
    const printReceipt = () => {
      const printWindow = window.open('', '', 'height=600,width=600');
      
      // Get the receipt content but exclude the button
      const receiptContentHTML = document.querySelector('.modal-content-receipt').cloneNode(true);
  
      // Remove the button before printing
      const button = receiptContentHTML.querySelector('.Submit');
      if (button) {
        button.remove();
      }
  
      printWindow.document.write('<html><head><title>Order Receipt</title></head><body>');
      printWindow.document.write(receiptContentHTML.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    };
  
    // Call the print function before closing the modal
    printReceipt();
    setReceiptModalOpen(false); // Close the modal
  };
  
  

  const handleChangeToAdmin = () => {
    closeUserRolesModal();
    navigate("/admin");
  };

  const fetchMenuItems = async () => {
    const menuItemsRef = collection(db, "menuItems");
    const menuItemsSnap = await getDocs(menuItemsRef);
    
    // Filter out menu items with 0 stock
    const items = menuItemsSnap.docs
      .map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }))
      .filter(item => item.stock > 0); // Filter out items with 0 stock
    
    setMenuItems(items);
  };
  

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          return prevCart.map((cartItem) =>
            cartItem._id === item._id
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          );
        } else {
          return prevCart.filter((cartItem) => cartItem._id !== item._id);
        }
      }
      return prevCart;
    });
  };

  const calculateTotalPrice = () => {
    return cart.reduce((total, cartItem) => {
      const itemTotal = cartItem.price * cartItem.quantity;
      return total + itemTotal;
    }, 0);
  };
  

  const calculateTotalItemsInCart = () => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  // Function to get the next priority number in "Cxxx" format
  const getNextPriorityNumber = async () => {
    const walkinClientsRef = collection(db, "walkinClients");
    const walkinClientsSnap = await getDocs(walkinClientsRef);
  
    // Extract valid priority numbers and find the highest one
    const priorityNumbers = walkinClientsSnap.docs
      .map(doc => doc.data().priorityNumber)
      .filter(num => typeof num === 'string' && num.startsWith("C")) // Ensure num is a string and starts with "C"
      .map(num => parseInt(num.slice(1), 10)) // Extract the numeric part only
      .sort((a, b) => b - a); // Sort in descending order
  
    const lastPriorityNumber = priorityNumbers[0] || 0; // Default to 0 if no orders
    const nextPriorityNumber = lastPriorityNumber + 1;
  
    return `C${String(nextPriorityNumber).padStart(3, '0')}`;
  };
  
  const submitOrder = async () => {
    if (cart.length === 0) return;
  
    const priorityNumber = await getNextPriorityNumber();
  
    const walkinClientOrder = {
      priorityNumber,
      orderItems: cart.map(({ _id, name, quantity, price }) => ({
        _id,
        name,
        quantity,
        price,
      })),
      totalPrice: calculateTotalPrice(),
      orderStatus: "Pending",
      assign: "Unassigned",
      createdAt: new Date(),
    };
  
    try {
      // Add the order to Firestore
      const walkinClientsRef = collection(db, "walkinClients");
      await addDoc(walkinClientsRef, walkinClientOrder);
  
      // Update stock for each item in the order
      for (const cartItem of cart) {
        const menuItemRef = doc(db, "menuItems", cartItem._id); // Get reference to the menu item
        await updateDoc(menuItemRef, {
          stock: cartItem.stock - cartItem.quantity, // Deduct the ordered quantity from stock
        });
      }
  
      // Fetch the updated menu items
      await fetchMenuItems();  // Refetch the menu items to get updated stock
  
      // Reset the cart and close the cart modal
      setCart([]);
      closeCartModal();
  
      // Set the receipt content and open the receipt modal
      setReceiptContent(walkinClientOrder);
      setReceiptModalOpen(true); // Open the receipt modal
  
    } catch (error) {
      console.error("Error submitting walk-in client order: ", error);
      alert("Failed to submit order. Please try again.");
    }
  };
  
  

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="WalkinClient">
      <nav className="navbar">
        <div className="navbar-logo">
          <img src={logo} className="App-verylog" alt="WildBites Logo" style={{ width: "650px", height: "auto", marginRight: "7%", marginTop: "0px" }} />
          <div className="navbar-buttons" style={{ marginTop: "20px", marginRight: "-150px", position: "relative" }}>
          <a href= "#" onClick={openUserRolesModal}className="ReturnToAdmin">Go to Admin</a>
            <button className="cart-btn" aria-label="View Cart" onClick={openCartModal}>
              <FaShoppingCart size={20} />
              {calculateTotalItemsInCart() > 0 && <span className="cart-count">{calculateTotalItemsInCart()}</span>}
            </button>
          </div>
        </div>

        {userRolesModalOpen && (
          <div className="modaluser-role">
            <div className="modal-contentuser-role">
              <h2>User Roles</h2>
              <p>Would you like to change this user role to Admin?</p>
              <div className="button-container">
                <button className="cancel-btn-roles" onClick={closeUserRolesModal}>Cancel</button>
                <button className="change-btn-roles" onClick={handleChangeToAdmin}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </nav>


      {/* Search Bar */}
      <div className="search-bar">
        <input type="text" placeholder="Search for dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
      </div>

      {/* Display Menu Items */}
      <div className="walkin-menu">
        {filteredMenuItems.map((item) => (
          <div key={item._id} className="item">
            <img src={item.image || "placeholder.png"} alt={item.name} className="item-image" />
            <h3>{item.name}</h3>
            <p className="stock">Stock: {item.stock}</p>
            <p className="price">Price: Php {item.price.toFixed(2)}</p>
            <button
    className="add-to-cart-button"
    onClick={() => addToCart(item)}
    disabled={item.stock <= 0 || cart.some(cartItem => cartItem._id === item._id && cartItem.quantity >= item.stock)}
  >
    Add to Cart
  </button>
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
            {cart.length > 0 && (
              <div className="cart-total">
                <h3>Total Price: Php {calculateTotalPrice().toFixed(2)}</h3>
              </div>
            )}
            <button className="close-cart-button" onClick={closeCartModal}>Close</button>
            {cart.length > 0 && <button className="proceed-payment-button" onClick={submitOrder}>Submit Order</button>}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModalOpen && receiptContent && (
        <div className="modal-receipt">
          <div className="modal-content-receipt">
            <h2>Order Receipt</h2>
            <p>{receiptContent.priorityNumber}</p>
            <h3>Ordered Items:</h3>
            <ul>
              {receiptContent.orderItems.map((item) => (
                <li key={item._id}>
                  <>{item.name}<b></b></> <>{item.quantity}<b></b></> <>Php {(item.price * item.quantity).toFixed(2)}</>
                </li>
              ))}
            </ul>
            <h3>Total Price: Php {receiptContent.totalPrice.toFixed(2)}</h3>
            <button className="Submit" onClick={closeReceiptModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalkinClient;
