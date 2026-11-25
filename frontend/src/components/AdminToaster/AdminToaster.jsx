import { Toaster } from 'react-hot-toast';

const AdminToaster = () => {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#111827',
          color: '#f9fafb',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px 14px',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          boxShadow: '0 12px 32px rgba(16, 24, 40, 0.25)'
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default AdminToaster;
