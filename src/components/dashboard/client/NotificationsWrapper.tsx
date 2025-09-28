import React from 'react';
import NotificationsErrorBoundary from './NotificationsErrorBoundary';
import Notifications from './Notifications';

/**
 * Wrapper component that provides error boundary protection for the Notifications component
 */
const NotificationsWrapper: React.FC = () => {
  return (
    <NotificationsErrorBoundary>
      <Notifications />
    </NotificationsErrorBoundary>
  );
};

export default NotificationsWrapper;