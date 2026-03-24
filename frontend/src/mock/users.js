export const adminUser = {
  id: 'admin-001',
  username: 'admin',
  password: 'admin123',
  name: 'Kidroo Admin',
  email: 'admin@kidroo.com',
  role: 'admin',
  avatar: null,
};

export const mockUser = {
  id: 'user-001',
  name: 'Yagnik Patel',
  email: 'yagnik@example.com',
  phone: '+91 99887 76655',
  avatar: null,
  address: {
    street: '42 Galaxy Apartments',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    country: 'India',
  },
  orderHistory: ['ORD-001', 'ORD-003'],
  wishlist: [2, 5, 9],
};

export const siteSettings = {
  siteName: 'Kidroo Toys',
  logo: null, // Dynamic — admin can upload
  tagline: 'Where Imagination Comes to Play! 🎈',
  primaryColor: '#FF6B35',
  hoverColor: '#E55A25',
  headerColor: '#1A1D2E',
  footerColor: '#1A1D2E',
  contactEmail: 'hello@kidrootoys.com',
  contactPhone: '+91 1800 123 4567',
  socialLinks: {
    facebook: 'https://facebook.com/kidrootoys',
    instagram: 'https://instagram.com/kidrootoys',
    twitter: 'https://twitter.com/kidrootoys',
    youtube: 'https://youtube.com/kidrootoys',
  },
};

export default { adminUser, mockUser, siteSettings };
