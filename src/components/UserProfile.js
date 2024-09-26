import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, deleteDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import SPLoader from './spinnerloader';
import { FaShoppingCart } from 'react-icons/fa';
import './UserProfile.css';
import logo from '../assets/logo.svg';

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuItem, setMenuItem] = useState({
    name: '',
    stock: '',
    price: '',
    image: null,
  });
  const [menuItems, setMenuItems] = useState([]);
  const navigate = useNavigate();

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

  const fetchMenuItems = async () => {
    const menuItemsRef = collection(db, 'menuItems');
    const menuItemsSnap = await getDocs(menuItemsRef);
    const items = menuItemsSnap.docs.map((doc) => ({ _id: doc.id, ...doc.data() }));
    setMenuItems(items);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        const menuItemRef = doc(db, 'menuItems', id);
        await deleteDoc(menuItemRef);
        console.log("Menu item deleted successfully!");

        // Refresh menu items after deletion
        fetchMenuItems();
      } catch (error) {
        console.error("Error deleting menu item: ", error);
      }
    }
  };

  const handleMenuItemChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setMenuItem({ ...menuItem, image: files[0] });
    } else {
      setMenuItem({ ...menuItem, [name]: value });
    }
  };

  const handleAddMenuSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (!menuItem.name || !menuItem.stock || !menuItem.price) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // Handle image upload if necessary
      let imageUrl = null;
      if (menuItem.image) {
        // Implement your image upload logic here, if needed
        // imageUrl = await uploadImage(menuItem.image);
      }

      // Prepare menu item data
      const newMenuItem = {
        name: menuItem.name,
        stock: Number(menuItem.stock),
        price: Number(menuItem.price),
        image: imageUrl // or use the URL from the upload
      };

      // Add new menu item to Firestore
      const menuItemsRef = collection(db, 'menuItems');
      await addDoc(menuItemsRef, newMenuItem);
      console.log("Menu item added successfully!");

      fetchMenuItems(); // Refresh menu items
      setModalOpen(false); // Close the modal
      setMenuItem({ name: '', stock: '', price: '', image: null }); // Reset form
    } catch (error) {
      console.error("Error adding menu item: ", error);
    }
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

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

  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-logo">
          <a href="/"><img src={logo} className="App-logo" alt="WildBites Logo" /></a>
          <div className="navbar-buttons" style={{ marginTop: '10px' }}>
            <button onClick={() => handleTabChange("menu")} className="nav-link">Menu</button>
            <button onClick={() => handleTabChange("orders")} className="nav-link">Orders</button>
            <button onClick={() => handleTabChange("reports")} className="nav-link">Reports</button>
            <button onClick={() => handleTabChange("userRoles")} className="nav-link">User Roles</button>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="user-profile">
            <img src={userData?.profilePic || 'defaultPic.png'} alt="Profile" className="profile-pic" />
            <span className="user-name">{userData?.name}</span>
          </div>

          <button onClick={openModal} className="btn add-menu-button">Add New Menu</button>
          
          <button className="btn cart-btn" aria-label="View Cart">
            <FaShoppingCart size={20} />
          </button>

          <button className="btn logout-btn" onClick={() => auth.signOut()}>Log Out</button>
        </div>
      </nav>

      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Menu Item</h2>
            <form onSubmit={handleAddMenuSubmit}>
              <label htmlFor="menuImage">Upload Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleMenuItemChange}
              />
              
              <label htmlFor="menuName">Item Name</label>
              <input
                type="text"
                name="name"
                value={menuItem.name}
                onChange={handleMenuItemChange}
                placeholder="Enter item name"
                required
              />

              <label htmlFor="menuStock">Maximum Stock</label>
              <input
                type="number"
                name="stock"
                value={menuItem.stock}
                onChange={handleMenuItemChange}
                placeholder="Enter maximum stock"
                required
              />

              <label htmlFor="menuPrice">Price</label>
              <input
                type="number"
                name="price"
                value={menuItem.price}
                onChange={handleMenuItemChange}
                placeholder="Enter price"
                required
              />

              <button type="submit" className="btn submit-btn">Submit</button>
              <button type="button" className="btn cancel-btn" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <div className="menu-items">
        {menuItems.length > 0 ? (
          menuItems.map((item) => (
            <div className="menu-item" key={item._id}>
              <div className="menu-image-container">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="menu-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "path/to/placeholder/image.jpg"; // Change to your placeholder image path
                    }}
                  />
                ) : (
                  <div className="menu-image-placeholder">No Image</div>
                )}
              </div>
              <div className="menu-details">
                <p className="menu-name">{item.name}</p>
                <p className="menu-price">₱{item.price.toFixed(2)}</p>
                <p className={`menu-quantity ${item.stock === 0 ? "sold-out" : ""}`}>
                  {item.stock > 0 ? `Available: ${item.stock}` : "Sold Out"}
                </p>
              </div>
              <div className="menu-actions">
                <button onClick={() => openModal(item)} className="action-link">edit</button>
                <button onClick={() => handleDelete(item._id)} className="action-link">delete</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No menu item/s added.</p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
