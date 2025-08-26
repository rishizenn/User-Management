import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Messages = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  
  // We no longer need the incoming/outgoing filter since all messages will be visible
  // But we'll keep a different type of filter for better organization
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    loadMessages();
  }, [currentUser]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Always get all available messages
      // The server will handle permissions
      const response = await api.get('/api/messages/all');
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.put(`/api/messages/${messageId}/read`);
      
      // Update message in local state
      setMessages(messages.map(message => 
        message.id === messageId 
          ? { ...message, read: true } 
          : message
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Filter messages based on the selected filters
  const getFilteredMessages = () => {
    // First filter by read status
    let filteredByStatus = filter === 'all' 
      ? messages 
      : filter === 'unread'
        ? messages.filter(message => !message.read)
        : messages.filter(message => message.read);
    
    // Then filter by involvement (all, involving my station, or not involving my station)
    if (viewMode === 'involving-me') {
      return filteredByStatus.filter(message => 
        message.from_station === currentUser.station_id || 
        message.to_station === currentUser.station_id
      );
    } else if (viewMode === 'others') {
      return filteredByStatus.filter(message => 
        message.from_station !== currentUser.station_id && 
        message.to_station !== currentUser.station_id
      );
    }
    
    // Default: return all messages
    return filteredByStatus;
  };

  const filteredMessages = getFilteredMessages();

  if (loading) {
    return (
      <DashboardLayout title="Railway Messages">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Railway Messages">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-palette-dark">Railway Message Center</h2>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input py-1 text-palette-dark"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Message type tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'all'
              ? 'text-palette-dark border-b-2 border-palette-dark'
              : 'text-palette-mid hover:text-palette-dark'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setViewMode('involving-me')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'involving-me'
              ? 'text-palette-dark border-b-2 border-palette-dark'
              : 'text-palette-mid hover:text-palette-dark'
          }`}
        >
          Involving My Station
        </button>
        <button
          onClick={() => setViewMode('others')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'others'
              ? 'text-palette-dark border-b-2 border-palette-dark'
              : 'text-palette-mid hover:text-palette-dark'
          }`}
        >
          Other Stations
        </button>
      </div>

      {filteredMessages.length > 0 ? (
        <div className="space-y-4">
          {filteredMessages.map(message => (
            <div 
              key={message.id} 
              className={`bg-white shadow rounded-lg p-4 border-l-4 ${
                message.read ? 'border-palette-mid' : 'border-palette-dark'
              }`}
            >
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium text-palette-dark">{message.sender?.name}</span>
                  <span className="mx-2 text-palette-mid">→</span>
                  <span className="font-medium text-palette-dark">{message.receiver?.name}</span>
                  
                  {/* Clearly indicate if this is a message to/from your station */}
                  {message.to_station === currentUser.station_id && (
                    <span className="ml-2 bg-palette-beige text-palette-dark text-xs px-2 py-1 rounded-full">To Your Station</span>
                  )}
                  {message.from_station === currentUser.station_id && (
                    <span className="ml-2 bg-palette-beige text-palette-dark text-xs px-2 py-1 rounded-full">From Your Station</span>
                  )}
                </div>
                <span className="text-xs text-palette-mid">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              
              <p className="text-palette-dark mb-3">{message.content}</p>
              
              <div className="flex justify-between items-center mt-2">
                <Link 
                  to={`/parcel/${message.parcel_id}`} 
                  className="text-sm text-palette-dark hover:text-palette-mid"
                >
                  View Parcel: {message.parcel?.tracking_number}
                </Link>
                
                {!message.read && message.to_station === currentUser.station_id && (
                  <button
                    onClick={() => handleMarkAsRead(message.id)}
                    className="text-xs bg-palette-beige hover:bg-palette-dark text-palette-dark hover:text-white py-1 px-3 rounded transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-palette-mid">
            {viewMode === 'involving-me' 
              ? 'No messages involving your station.' 
              : viewMode === 'others'
                ? 'No messages between other stations.'
                : 'No messages available.'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Messages; 