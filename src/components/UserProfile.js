import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase/firebase'; // Ensure storage is imported correctly
import { doc, getDoc, deleteDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import SPLoader from './spinnerloader';
import { FaShoppingCart } from 'react-icons/fa';
import './UserProfile.css';
import logo from '../assets/maindash.svg';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import Firebase Storage functions

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [menuItem, setMenuItem] = useState({
    name: '',
    stock: '',
    price: '',
    image: null,
  });
  const [menuItems, setMenuItems] = useState([]);
  const [currentItemId, setCurrentItemId] = useState(null);
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

  // Handle deletion of menu items
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        const menuItemRef = doc(db, 'menuItems', id);
        await deleteDoc(menuItemRef);
        console.log("Menu item deleted successfully!");
        fetchMenuItems();
      } catch (error) {
        console.error("Error deleting menu item: ", error);
      }
    }
  };

  // Handle form input change
  const handleMenuItemChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setMenuItem({ ...menuItem, image: files[0] });
    } else {
      setMenuItem({ ...menuItem, [name]: value });
    }
  };

  // Handle new menu item submission
  const handleAddMenuSubmit = async (e) => {
    e.preventDefault();
    if (!menuItem.name || !menuItem.stock || !menuItem.price) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      let imageUrl = null;
      if (menuItem.image) {
        // Upload the image to Firebase Storage
        const imageRef = ref(storage, `menuImages/${menuItem.image.name}`);
        const uploadSnapshot = await uploadBytes(imageRef, menuItem.image);
        imageUrl = await getDownloadURL(uploadSnapshot.ref); // Get image URL
      }

      // Add new menu item data to Firestore
      const newMenuItem = {
        name: menuItem.name,
        stock: Number(menuItem.stock),
        price: Number(menuItem.price),
        image: imageUrl,
      };
      await addDoc(collection(db, 'menuItems'), newMenuItem);
      fetchMenuItems();
      setModalOpen(false);
      setMenuItem({ name: '', stock: '', price: '', image: null });
      window.location.reload();
    } catch (error) {
      console.error("Error adding menu item: ", error);
    }
  };

  // Handle editing of menu items
  const handleEditMenuItem = (item) => {
    setCurrentItemId(item._id);
    setMenuItem({
      name: item.name,
      stock: item.stock,
      price: item.price,
      image: null,
    });
    setEditModalOpen(true);
  };

  // Handle updated menu item submission
  const handleEditMenuSubmit = async (e) => {
    e.preventDefault();
    if (!menuItem.name || !menuItem.stock || !menuItem.price) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      let imageUrl = null;
      if (menuItem.image) {
        // Upload the new image to Firebase Storage
        const imageRef = ref(storage, `menuImages/${menuItem.image.name}`);
        const uploadSnapshot = await uploadBytes(imageRef, menuItem.image);
        imageUrl = await getDownloadURL(uploadSnapshot.ref); // Get image URL
      }

      // Update menu item data in Firestore
      const menuItemRef = doc(db, 'menuItems', currentItemId);
      await updateDoc(menuItemRef, {
        name: menuItem.name,
        stock: Number(menuItem.stock),
        price: Number(menuItem.price),
        image: imageUrl || null, // Use the new image URL or keep it the same
      });

      fetchMenuItems();
      setEditModalOpen(false);
      setMenuItem({ name: '', stock: '', price: '', image: null });
    } catch (error) {
      console.error("Error updating menu item: ", error);
    }
  };

  // Open and close modal for adding menu items
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Open and close modal for editing menu items
  const closeEditModal = () => {
    setEditModalOpen(false);
    setMenuItem({ name: '', stock: '', price: '', image: null });
  };

  // Handle navigation between different tabs
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
                placeholder="Enter item price"
                required
              />

              <button type="submit" className="btn submit-btn">Add Item</button>
              <button type="button" className="btn cancel-btn" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Menu Item</h2>
            <form onSubmit={handleEditMenuSubmit}>
              <label htmlFor="menuImage">Upload New Image (optional)</label>
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
                placeholder="Enter item price"
                required
              />

              <button type="submit" className="btn submit-btn">Update Item</button>
              <button type="button" className="btn cancel-btn" onClick={closeEditModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

<div className="menu-items">
  {menuItems.map(item => (
    <div key={item._id} className="menu-item">
      <img src={item.image || 'placeholder.png'} alt={item.name} className="menu-item-image" />
      <h3>{item.name}</h3>
      <p className="stock">Stock: {item.stock}</p>
      <p className="price">Price: ${item.price.toFixed(2)}</p>
      <div className="button-container">
        <button className="btn edit-button" onClick={() => handleEditMenuItem(item)}>Edit</button>
        <button className="btn delete-button" onClick={() => handleDelete(item._id)}>Delete</button>
      </div>
    </div>
  ))}
</div>
    </div>
  );
}

export default UserProfile;
