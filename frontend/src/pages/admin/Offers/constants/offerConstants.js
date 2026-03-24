export const offerTypes = [
  { value: 'slider', label: '🎠 Image Slider', desc: 'Carousel of promotional images' },
  { value: 'fullscreen-poster', label: '🖼️ Full Screen Poster', desc: 'Full-width promotional banner' },
  { value: 'post', label: '📝 Post / Card', desc: 'Simple promotional card' },
  { value: 'buyable', label: '🛒 Buyable Product', desc: 'Product card with buy button' },
];

export const initialFormState = {
  title: '', subtitle: '', description: '', type: 'post',
  images: [], existingImages: [], discountPercentage: '', couponCode: '', validFrom: '', validTo: '',
  isActive: true, bgColor: '#FF6B35', textColor: '#FFFFFF',
  targetUrl: ''
};
