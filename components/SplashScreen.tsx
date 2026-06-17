
import React, { useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-yellow-400 flex flex-col items-center justify-center z-50">
      <div className="splash-fade flex flex-col items-center">
        <div className="bg-white p-6 rounded-full shadow-2xl mb-6">
          <MapPin size={64} className="text-yellow-500 fill-yellow-100" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">PROXIMITY</h1>
        <p className="text-yellow-900 font-medium mt-2">Local Flavors, Freshly Made</p>
      </div>
    </div>
  );
};

export default SplashScreen;
