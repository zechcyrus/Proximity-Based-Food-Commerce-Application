
import React, { useState } from 'react';
import { UserRole } from '../types';
import { ChevronRight, Mail, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthScreenProps {
  onLogin: (role: UserRole) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('buyer');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const executeAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set display name if provided
        if (fullName) {
          await updateProfile(user, { displayName: fullName });
        }

        // 3. Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          role: role,
          verificationStatus: 'unverified',
          displayName: fullName || null,
          createdAt: serverTimestamp()
        });

        onLogin(role);
      } else {
        // Sign in logic
        await signInWithEmailAndPassword(auth, email, password);
        // Note: In a real app, you would fetch the user's role from Firestore here
        onLogin(role);
      }
    } catch (err: any) {
      console.error("Auth error details:", err.code, err.message);
      let message = "An error occurred during authentication.";
      
      switch (err.code) {
        case 'auth/invalid-credential':
          message = "Invalid email or password. Please try again.";
          break;
        case 'auth/user-not-found':
          message = "No account found with this email. Please sign up.";
          break;
        case 'auth/wrong-password':
          message = "Incorrect password. Please try again.";
          break;
        case 'auth/email-already-in-use':
          message = "This email is already registered. Try signing in.";
          break;
        case 'auth/invalid-email':
          message = "Please enter a valid email address.";
          break;
        case 'auth/weak-password':
          message = "Password should be at least 6 characters long.";
          break;
        case 'auth/too-many-requests':
          message = "Too many failed attempts. Please try again later.";
          break;
        default:
          message = err.message || message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      setShowDisclaimer(true);
    } else {
      executeAuth();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 animate-in fade-in duration-500">
      <div className="mt-12 mb-8">
        <h2 className="text-3xl font-black text-gray-900">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-500 font-medium mt-2">Join your local cooking community</p>
      </div>

      <div className="flex bg-gray-200 p-1.5 rounded-2xl mb-8">
        <button
          type="button"
          onClick={() => setRole('buyer')}
          className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${
            role === 'buyer' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          I'm a Buyer
        </button>
        <button
          type="button"
          onClick={() => setRole('cook')}
          className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${
            role === 'cook' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          I'm a Cook
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="relative animate-in slide-in-from-top-2 duration-300">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              required={isSignUp}
            />
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-2xl shadow-xl shadow-yellow-100 flex items-center justify-center gap-2 mt-4 transition-transform active:scale-95 disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {isSignUp ? 'Signing Up...' : 'Signing In...'}
            </>
          ) : (
            <>
              {isSignUp ? 'Sign Up' : 'Sign In'}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </form>

      <div className="mt-auto text-center pb-8">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setShowDisclaimer(false);
          }}
          className="text-gray-600 font-black uppercase text-[10px] tracking-widest"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>

      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <h3 className="text-xl font-black text-gray-900 mb-4">Terms & Disclaimer</h3>
            <div className="overflow-y-auto flex-1 mb-6 text-sm text-gray-600 leading-relaxed pr-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {role === 'buyer' ? (
                <p>
                  By placing an order on this platform, you acknowledge that all food items are prepared and sold by independent providers. The platform does not cook, handle, or inspect the food. Buyers are responsible for confirming ingredients, allergens, and dietary suitability with the provider before ordering. The platform is not liable for any food quality issues, allergic reactions, illness, or damages resulting from the consumption of food purchased through the app.
                </p>
              ) : (
                <p>
                  By registering as a provider, you confirm that you are solely responsible for the preparation, safety, hygiene, ingredients, and quality of the food you sell. You agree to comply with all applicable food safety regulations and obtain any required licenses or registrations. You accept full responsibility for any claims, damages, or legal issues arising from the food you provide through the platform.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setShowDisclaimer(false)}
                className="flex-1 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDisclaimer(false);
                  executeAuth();
                }}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-xl shadow-lg shadow-yellow-100 transition-transform active:scale-95"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;