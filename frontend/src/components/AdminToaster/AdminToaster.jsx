import { Toaster } from 'react-hot-toast';

const AdminToaster = () => {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#1A1D2E',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px',
          fontFamily: 'inherit',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        },
        success: {
          iconTheme: {
            primary: '#00D4AA',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default AdminToaster;
