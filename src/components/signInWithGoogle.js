import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../firebase/firebase'; // Adjust the path if needed

const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google sign-in successful:', user);
      // Perform any additional logic like storing user data in Firestore
    } catch (error) {
      console.error('Google sign-in error:', error.message);
      console.error('Error details:', error); // Log more details
    }
  };

export default signInWithGoogle;