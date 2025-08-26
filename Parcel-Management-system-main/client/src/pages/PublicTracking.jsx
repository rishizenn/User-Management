import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaTrain, 
  FaSearch, 
  FaBox, 
  FaClock, 
  FaTruck, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaArrowDown,
  FaMapMarkerAlt,
  FaCalendar,
  FaWeightHanging,
  FaUser,
  FaPhone,
  FaHistory,
  FaQrcode
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import DeveloperCredit from '../components/DeveloperCredit';
import { generateQRCodeDataURL, generateTrackingURL } from '../utils/qrGenerator';

const PublicTracking = () => {
  const { trackingNumber: urlTrackingNumber } = useParams();
  const navigate = useNavigate();
  
  const [trackingNumber, setTrackingNumber] = useState(urlTrackingNumber || '');
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (urlTrackingNumber) {
      handleTrackParcel(urlTrackingNumber);
    }
  }, [urlTrackingNumber]);

  const handleTrackParcel = async (trackingNum = trackingNumber) => {
    if (!trackingNum.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Make a public API call to track the parcel
      const response = await api.get(`/api/parcels/track/${trackingNum}`);
      setParcel(response.data);
      
      // Update URL if tracking from search
      if (!urlTrackingNumber) {
        navigate(`/track/${trackingNum}`, { replace: true });
      }
    } catch (err) {
      console.error('Error tracking parcel:', err);
      if (err.response?.status === 404) {
        setError('Parcel not found. Please check your tracking number.');
      } else {
        setError('Unable to track parcel. Please try again later.');
      }
      setParcel(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return FaClock;
      case 'in_transit': return FaTruck;
      case 'delivered': return FaCheckCircle;
      case 'returned': return FaArrowDown;
      case 'lost': return FaExclamationTriangle;
      default: return FaBox;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'in_transit': return 'status-in_transit';
      case 'delivered': return 'status-delivered';
      case 'returned': return 'status-returned';
      case 'lost': return 'status-lost';
      default: return 'status-pending';
    }
  };

  const getTrackingSteps = () => {
    if (!parcel) return [];
    
    const steps = [
      { status: 'pending', label: 'Order Received', description: 'Parcel received at origin station' },
      { status: 'in_transit', label: 'In Transit', description: 'Parcel is being transported' },
      { status: 'delivered', label: 'Delivered', description: 'Parcel delivered successfully' }
    ];
    
    const currentIndex = steps.findIndex(step => step.status === parcel.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-palette-light">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-palette-mid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-palette-mid to-palette-dark rounded-lg flex items-center justify-center mr-3">
                <FaTrain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-palette-dark">Railway Parcel Tracking</h1>
                <p className="text-sm text-palette-mid">Track your parcels in real-time</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Station Login
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="card bg-white border border-palette-mid rounded-2xl p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-palette-dark mb-2">Track Your Parcel</h2>
            <p className="text-palette-mid">Enter your tracking number to get real-time updates</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleTrackParcel(); }} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter tracking number (e.g., TRK-2024-001234)"
                className="form-input text-center font-mono text-palette-dark"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              />
            </div>
            <button
              type="submit"
              className="btn-primary bg-palette-beige text-palette-dark font-semibold rounded-xl hover:bg-palette-mid focus:outline-none focus:ring-2 focus:ring-palette-dark focus:ring-offset-2 transition-all duration-200 shadow-lg"
              disabled={loading}
            >
              <FaSearch className="w-4 h-4 mr-2 text-palette-dark transition-colors" />
              Track
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-palette-beige border border-palette-mid rounded-lg p-4">
              <p className="text-palette-dark text-center">{error}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-palette-mid">Tracking your parcel...</p>
          </div>
        )}

        {parcel && !loading && (
          <div className="space-y-8 animate-fade-in">
            {/* Parcel Status Header */}
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-palette-dark mb-2">
                    Tracking: {parcel.tracking_number}
                  </h3>
                  <p className="text-palette-mid">
                    Last updated: {formatDate(parcel.updatedAt)}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border text-palette-dark bg-palette-beige border-palette-mid">
                    {React.createElement(getStatusIcon(parcel.status), { className: "w-4 h-4 mr-2" })}
                    {parcel.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="btn-outline"
                  >
                    <FaQrcode className="w-4 h-4 mr-2" />
                    QR Code
                  </button>
                </div>
              </div>

              {showQR && (
                <div className="mt-6 pt-6 border-t border-palette-mid text-center">
                  <h4 className="text-lg font-semibold text-palette-dark mb-4">Share Tracking</h4>
                  <div className="inline-block bg-white p-4 rounded-lg shadow-lg">
                    <img 
                      src={generateQRCodeDataURL(generateTrackingURL(parcel.tracking_number), 200)}
                      alt="Tracking QR Code"
                      className="mx-auto"
                    />
                    <p className="mt-2 text-sm text-palette-mid">Scan to track this parcel</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tracking Timeline */}
            <div className="card">
              <h4 className="text-lg font-semibold text-palette-dark mb-6 flex items-center">
                <FaHistory className="w-5 h-5 mr-2" />
                Tracking Timeline
              </h4>
              
              <div className="space-y-6">
                {getTrackingSteps().map((step, index) => (
                  <div key={step.status} className="flex items-center">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-palette-dark text-white' 
                        : 'bg-palette-light text-palette-mid'
                    }`}>
                      {step.completed ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`font-semibold ${
                        step.completed ? 'text-palette-dark' : 'text-palette-mid'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-palette-mid">{step.description}</p>
                      {step.current && (
                        <p className="text-xs text-palette-dark font-medium mt-1">Current Status</p>
                      )}
                    </div>
                    {step.current && (
                      <span className="ml-2 px-2 py-1 bg-palette-beige text-palette-dark text-xs rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Parcel Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Route Information */}
              <div className="card">
                <h4 className="text-lg font-semibold text-palette-dark mb-4 flex items-center">
                  <FaMapMarkerAlt className="w-5 h-5 mr-2" />
                  Route Information
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-palette-light rounded-lg">
                    <div>
                      <p className="text-sm text-palette-mid">Origin</p>
                      <p className="font-semibold text-palette-dark">{parcel.senderStation?.name}</p>
                      <p className="text-xs text-palette-mid">{parcel.senderStation?.code}</p>
                    </div>
                    <div className="text-palette-mid">
                      <FaArrowDown className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-palette-light rounded-lg">
                    <div>
                      <p className="text-sm text-palette-mid">Destination</p>
                      <p className="font-semibold text-palette-dark">{parcel.receiverStation?.name}</p>
                      <p className="text-xs text-palette-mid">{parcel.receiverStation?.code}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parcel Details */}
              <div className="card">
                <h4 className="text-lg font-semibold text-palette-dark mb-4 flex items-center">
                  <FaBox className="w-5 h-5 mr-2" />
                  Parcel Details
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FaWeightHanging className="w-4 h-4 text-palette-mid mr-3" />
                    <div>
                      <p className="text-sm text-palette-mid">Weight</p>
                      <p className="font-medium text-palette-dark">{parcel.weight || 'Not specified'} kg</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FaCalendar className="w-4 h-4 text-palette-mid mr-3" />
                    <div>
                      <p className="text-sm text-palette-mid">Shipped Date</p>
                      <p className="font-medium text-palette-dark">{formatDate(parcel.createdAt)}</p>
                    </div>
                  </div>
                  
                  {parcel.description && (
                    <div className="flex items-start">
                      <FaBox className="w-4 h-4 text-palette-mid mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-palette-mid">Description</p>
                        <p className="font-medium text-palette-dark">{parcel.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="card lg:col-span-2">
                <h4 className="text-lg font-semibold text-palette-dark mb-4 flex items-center">
                  <FaUser className="w-5 h-5 mr-2" />
                  Contact Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-palette-dark mb-2">Sender</h5>
                    <p className="text-palette-dark">{parcel.sender_name}</p>
                    {parcel.sender_contact && (
                      <div className="flex items-center mt-1 text-sm text-palette-mid">
                        <FaPhone className="w-3 h-3 mr-2" />
                        {parcel.sender_contact}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-palette-dark mb-2">Receiver</h5>
                    <p className="text-palette-dark">{parcel.receiver_name}</p>
                    {parcel.receiver_contact && (
                      <div className="flex items-center mt-1 text-sm text-palette-mid">
                        <FaPhone className="w-3 h-3 mr-2" />
                        {parcel.receiver_contact}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-palette-dark text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <FaTrain className="w-6 h-6 mr-2" />
            <span className="text-lg font-semibold">Railway Parcel Management System</span>
          </div>
          <p className="text-palette-mid mb-6">Reliable parcel tracking and management for railway networks</p>
          
          {/* Developer Credit */}
          <div className="border-t border-palette-mid pt-6">
            <DeveloperCredit 
              variant="footer" 
              showTitle={true} 
              showDescription={true}
              showSocialLinks={true}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicTracking; 