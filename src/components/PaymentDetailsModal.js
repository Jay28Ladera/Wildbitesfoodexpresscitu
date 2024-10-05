import React, { useState, useEffect } from "react";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

const PaymentDetailsModal = ({ isOpen, onClose, storage, db }) => {
  const [image, setImage] = useState(null);
  const [number, setNumber] = useState("");
  const [existingImage, setExistingImage] = useState(null);
  const [existingNumber, setExistingNumber] = useState("");
  const [error, setError] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentDetails();
    }
  }, [isOpen]);

  const fetchPaymentDetails = async () => {
    try {
      const docRef = doc(db, "paymentDetails", "default");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExistingImage(data.image);
        setExistingNumber(data.number);
        setNumber(data.number);
      }
    } catch (error) {
      console.error("Error fetching payment details: ", error);
    }
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleNumberChange = (e) => {
    setNumber(e.target.value);
    setError(""); // Clear error when user starts typing
  };

  const handleRemoveImage = () => {
    setExistingImage(null);
    setImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation logic
    const numberPattern = /^\d{11}$/;
    if (!numberPattern.test(number)) {
      setError("Number must be exactly 11 digits and contain no letters.");
      return;
    }

    try {
      let imageUrl = existingImage;

      if (image) {
        if (existingImage) {
          // Delete the existing image from Firebase Storage
          const imageRef = ref(storage, existingImage);
          await deleteObject(imageRef);
        }

        // Upload the new image to Firebase Storage
        const imageRef = ref(storage, `paymentDetails/${image.name}`);
        const uploadSnapshot = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(uploadSnapshot.ref); // Get image URL
      }

      // Update payment details in Firestore
      const paymentDetails = {
        image: imageUrl,
        number: number, // Store number as a string
      };
      await setDoc(doc(db, "paymentDetails", "default"), paymentDetails);

      console.log("Payment details updated successfully!");
      setError(""); // Clear error on successful submission
      onClose(); // Close the modal after submission
    } catch (error) {
      console.error("Error updating payment details: ", error);
    }
  };

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-wrapper">
      <div className="payment-content">
        <span className="payment-close" onClick={onClose}>
          &times;
        </span>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="payment-label">QR Code</label>
            {existingImage && (
              <div className="payment-uploaded-image-container">
                <img
                  src={existingImage}
                  alt="Current"
                  className="payment-uploaded-image"
                  onClick={handleImageClick} /* Add onClick handler */
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="payment-remove-button"
                >
                  Remove Current Image
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <div>
            <label className="payment-label">
              Enter Account/Mobile Number:
            </label>
            <input type="text" value={number} onChange={handleNumberChange} />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className="payment-button-container">
            <button
              type="button"
              onClick={onClose}
              className="payment-cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" className="payment-submit-btn">
              Submit
            </button>
          </div>
        </form>
      </div>

      {isImageModalOpen && (
        <div className="payment-image-wrapper">
          <div className="payment-image-content">
            <span className="payment-close" onClick={closeImageModal}>
              &times;
            </span>
            <img
              src={existingImage}
              alt="Current"
              className="payment-large-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetailsModal;
