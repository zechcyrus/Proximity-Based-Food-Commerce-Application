
import React, { useState, useRef } from 'react';
import { Plus, Package, Sparkles, X, Camera, Leaf, Beef, TrendingUp, MapPin, Navigation, Search as SearchIcon, Edit, Trash2, Image as ImageIcon, Loader2, ShieldCheck, AlertCircle, Upload } from 'lucide-react';
import { generateDishDescription, searchAddress } from '../services/geminiService';
import { DietaryType, Order, FoodItem, OrderStatus, User } from '../types';
import { uploadImage, updateUserProfile } from '../services/db';

interface ProviderHomeProps {
  orders: Order[];
  listings: FoodItem[];
  user: User | null;
  onAddListing: (food: FoodItem, imageFile?: File) => Promise<void>;
  onEditListing: (food: FoodItem, imageFile?: File) => Promise<void>;
  onDeleteListing: (id: string) => void;
  onUpdateOrder: (id: string, status: OrderStatus) => void;
  onChat: (order: Order) => void;
}

const ProviderHome: React.FC<ProviderHomeProps> = ({ orders, listings, user, onAddListing, onEditListing, onDeleteListing, onUpdateOrder, onChat }) => {
  const [isAddingListing, setIsAddingListing] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // License Upload State
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Real-time calculation from props - only confirmed/delivered orders count towards revenue/sales
  const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'delivered');
  const revenue = confirmedOrders.reduce((acc, curr) => acc + curr.total, 0);
  const totalSales = confirmedOrders.length;

  // Listing Form State
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [dietaryType, setDietaryType] = useState<DietaryType>('veg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicensePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitLicense = async () => {
    if (!licenseFile || !user) return;
    
    setIsUploadingLicense(true);
    try {
      const fileExtension = licenseFile.name.split('.').pop() || 'jpg';
      const fileName = `licenses/${user.uid}_${Date.now()}.${fileExtension}`;
      const url = await uploadImage(licenseFile, fileName);
      await updateUserProfile(user.uid, {
        licenseUrl: url,
        verificationStatus: 'pending',
        licenseUploadedAt: new Date()
      });
      alert("License uploaded successfully! Verification is pending.");
    } catch (error) {
      console.error("Error uploading license:", error);
      alert("Failed to upload license.");
    } finally {
      setIsUploadingLicense(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-yellow-500" size={40} />
      </div>
    );
  }

  const verificationStatus = user.verificationStatus || 'unverified';

  if (verificationStatus === 'unverified') {
    return (
      <div className="p-6 pt-12 animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-600">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Your Kitchen</h2>
        <p className="text-gray-500 mb-8 max-w-xs">To ensure quality and safety, please upload your Food License (FSSAI) to start selling.</p>
        
        <div className="w-full max-w-sm bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
          <div 
            onClick={() => licenseInputRef.current?.click()}
            className="h-48 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative"
          >
            <input type="file" ref={licenseInputRef} onChange={handleLicenseChange} accept="image/*" className="hidden" />
            
            {licensePreview ? (
              <>
                <img src={licensePreview} alt="License Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white font-bold text-sm">Click to change</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-bold text-gray-500">Upload License Photo</p>
                <p className="text-[10px] text-gray-400">Supported: JPG, PNG</p>
              </>
            )}
          </div>
          
          <button 
            onClick={submitLicense}
            disabled={!licenseFile || isUploadingLicense}
            className="w-full mt-6 bg-gray-900 text-white py-4 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploadingLicense ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
            {isUploadingLicense ? 'Uploading...' : 'Submit for Verification'}
          </button>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <div className="p-6 pt-12 animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 animate-pulse">
          <Loader2 size={40} className="animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Verification Pending</h2>
        <p className="text-gray-500 mb-8 max-w-xs">We are reviewing your license. This usually takes 24-48 hours. You will be notified once approved.</p>
        
        <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-start gap-3 text-left max-w-xs">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-yellow-800 font-medium">
            Tip: While you wait, you can prepare your menu items and photos offline!
          </p>
        </div>
      </div>
    );
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        if (!address) setAddress("Current GPS Location Captured");
      },
      (error) => {
        console.error("Error fetching location", error);
        alert("Unable to retrieve your location. Please type your address manually.");
        setIsLocating(false);
      }
    );
  };

  const handleAddressSearch = async () => {
    if (!address) return;
    setIsSearchingAddress(true);
    const result = await searchAddress(address, location ? { latitude: location.lat, longitude: location.lng } : undefined);
    if (result) {
      setAddress(result.address);
    }
    setIsSearchingAddress(false);
  };

  const handleAIDescription = async () => {
    if (!title) return;
    setIsGenerating(true);
    const desc = await generateDishDescription(title, dietaryType);
    setDescription(desc);
    setIsGenerating(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAddress('');
    setLocation(null);
    setPrice('');
    setQuantity('1');
    setDescription('');
    setDietaryType('veg');
    setImagePreview(null);
    setImageFile(null);
    setIsAddingListing(false);
    setEditingFood(null);
    setIsSubmitting(false);
  };

  const handleEditClick = (food: FoodItem) => {
    setEditingFood(food);
    setTitle(food.title);
    setAddress(food.address);
    setPrice(food.price.toString());
    setQuantity(food.quantity.toString());
    setDescription(food.description);
    setDietaryType(food.dietaryType);
    setImagePreview(food.image);
    setImageFile(null); // Reset file input for edit unless changed
    if (food.latitude && food.longitude) {
      setLocation({ lat: food.latitude, lng: food.longitude });
    }
    setIsAddingListing(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Are you sure you want to remove this dish?")) {
      onDeleteListing(id);
    }
  };

  const handleSubmit = async () => {
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity);

    if (!title || isNaN(parsedPrice) || isNaN(parsedQuantity) || !description || !address) {
      alert("Please fill in all required fields.");
      return;
    }
    
    if (parsedPrice <= 0 || parsedQuantity <= 0) {
      alert("Price and Quantity must be positive values.");
      return;
    }
    
    setIsSubmitting(true);

    const foodData: FoodItem = {
      id: editingFood ? editingFood.id : Math.random().toString(36).substr(2, 9),
      cookId: user.uid,
      cookName: user.displayName || 'Home Cook',
      title,
      description,
      price: parsedPrice,
      image: imagePreview || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      address,
      latitude: location?.lat || 0, // Default to 0 if not located
      longitude: location?.lng || 0,
      category: 'Homemade',
      distance: '0.0 km',
      rating: 5.0,
      availableUntil: '9:00 PM',
      quantity: parsedQuantity,
      dietaryType,
    };

    try {
      if (editingFood) {
        await onEditListing(foodData, imageFile || undefined);
      } else {
        await onAddListing(foodData, imageFile || undefined);
      }
      resetForm();
    } catch (error) {
      console.error("Error submitting listing:", error);
      alert("Failed to submit listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-32 p-6 pt-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Chef Dashboard</h1>
          <p className="text-gray-500 font-medium">Manage your kitchen</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-100">
          <TrendingUp className="text-gray-900" size={24} />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-widest">Revenue</p>
          <p className="text-2xl font-black text-gray-900">₹{revenue.toFixed(0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-widest">Sales</p>
          <p className="text-2xl font-black text-gray-900">{totalSales}</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black text-gray-900">Live Orders</h2>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {orders.length > 0 ? orders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{order.itemTitle}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">{order.buyerName} • 1 portion</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {order.status !== 'pending' && (
                    <button
                      onClick={() => onChat(order)}
                      className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Chat
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (order.status === 'pending') onUpdateOrder(order.id, 'confirmed');
                      else if (order.status === 'confirmed') onUpdateOrder(order.id, 'delivered');
                    }}
                    disabled={order.status === 'delivered'}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                      order.status === 'pending' 
                        ? 'bg-yellow-400 text-gray-900 active:scale-95' 
                        : order.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-700 active:scale-95 hover:bg-blue-200'
                          : 'bg-green-100 text-green-700 pointer-events-none'
                    }`}
                  >
                    {order.status === 'pending' ? 'Confirm' : order.status === 'confirmed' ? 'Mark Delivered' : 'Delivered'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-xs font-medium">No orders yet.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black text-gray-900 mb-4">Your Listings</h2>
          <div className="grid grid-cols-1 gap-4">
            {listings.filter(f => f.cookId === user.uid && f.quantity > 0).length > 0 ? listings.filter(f => f.cookId === user.uid && f.quantity > 0).map(dish => (
              <div key={dish.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm group">
                <img src={dish.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm">{dish.title}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">₹{dish.price} • {dish.quantity} left</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(dish)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(dish.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className={`w-2 h-2 rounded-full ${dish.dietaryType === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            )) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-xs font-medium">Add a dish to start!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button 
          onClick={() => { resetForm(); setIsAddingListing(true); }}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          <Plus size={20} /> Create New Listing
        </button>
      </div>

      {isAddingListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end animate-in fade-in slide-in-from-bottom-20 duration-300">
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 max-h-[95vh] overflow-y-auto pb-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">{editingFood ? 'Edit Dish' : 'New Dish'}</h2>
              <button onClick={resetForm} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {imagePreview ? (
                <div 
                  className="relative w-full h-48 rounded-3xl overflow-hidden border-2 border-transparent ring-2 ring-yellow-400 group"
                >
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <ImageIcon size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-500">Gallery</p>
                  </div>

                  <div 
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-32 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <input type="file" ref={cameraInputRef} onChange={handleImageChange} accept="image/*" capture="environment" className="hidden" />
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <Camera size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-500">Camera</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Dish Name</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-yellow-400" 
                  placeholder="e.g. Grandma's Curry"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Price (₹)</label>
                  <input 
                    type="number" 
                    min="1"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-yellow-400" 
                    placeholder="e.g. 250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    step="1"
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-yellow-400" 
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Address</label>
                   <button 
                     onClick={handleAddressSearch} 
                     disabled={isSearchingAddress}
                     className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                   >
                     {isSearchingAddress ? <Loader2 size={12} className="animate-spin" /> : null}
                     {isSearchingAddress ? 'Verifying...' : 'Verify on Map'}
                   </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-4 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-yellow-400" 
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                  <button 
                    type="button" 
                    onClick={handleAIDescription} 
                    disabled={isGenerating}
                    className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {isGenerating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-yellow-400" placeholder="A brief tasty description..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDietaryType('veg')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all ${
                    dietaryType === 'veg' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <Leaf size={16} /> Veg
                </button>
                <button
                  onClick={() => setDietaryType('non-veg')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all ${
                    dietaryType === 'non-veg' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <Beef size={16} /> Non-Veg
                </button>
              </div>

              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full bg-yellow-400 text-gray-900 py-4 rounded-2xl font-black shadow-lg shadow-yellow-100 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {editingFood ? 'Updating...' : 'Publishing...'}
                  </>
                ) : (
                  editingFood ? 'Update Listing' : 'Publish Listing'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderHome;
