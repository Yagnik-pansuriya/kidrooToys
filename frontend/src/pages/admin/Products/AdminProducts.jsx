import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { products as initialProducts } from '../../../mock/products';
import { categories } from '../../../mock/categories';
import './AdminProducts.scss';

const AdminProducts = () => {
  const [productList, setProductList] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', price: '', originalPrice: '', category: '', description: '',
    image: '', stock: '', ageRange: '', rating: 4.5, reviews: 0,
    featured: false, newArrival: false, bestSeller: false, discount: 0,
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', price: '', originalPrice: '', category: '', description: '', image: '', stock: '', ageRange: '', rating: 4.5, reviews: 0, featured: false, newArrival: false, bestSeller: false, discount: 0 });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product.id);
    setForm({
      name: product.name, price: product.price, originalPrice: product.originalPrice || '',
      category: product.category, description: product.description,
      image: product.image, stock: product.stock, ageRange: product.ageRange || '',
      rating: product.rating, reviews: product.reviews,
      featured: product.featured, newArrival: product.newArrival, bestSeller: product.bestSeller,
      discount: product.discount || 0,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProductList(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully!');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.originalPrice || form.stock === '' || !form.image) {
      alert("Please fill all compulsory fields: Product Name, Price, Original Price, Stock, and Product Image.");
      return;
    }

    if (parseFloat(form.price) < 0 || parseFloat(form.originalPrice) < 0 || parseInt(form.stock) < 0) {
      alert("Price, Original Price, and Stock cannot be negative.");
      return;
    }

    if (editing) {
      setProductList(prev => prev.map(p => p.id === editing ? { ...p, ...form, price: parseFloat(form.price), originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null, stock: parseInt(form.stock), discount: parseInt(form.discount) } : p));
      toast.success('Product updated successfully!');
    } else {
      const newProduct = {
        ...form,
        id: Date.now(),
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        stock: parseInt(form.stock),
        discount: parseInt(form.discount),
        images: [form.image],
        categoryId: categories.find(c => c.slug === form.category)?.id || 1,
        tags: [],
      };
      setProductList(prev => [newProduct, ...prev]);
      toast.success('Product added successfully!');
    }
    setShowModal(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setForm(prev => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="admin-products">
      <div className="admin-products__header">
        <h1>Products 📦</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus /> Add Product
        </button>
      </div>

      <div className="admin-products__table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productList.map(product => (
              <tr key={product.id}>
                <td>
                  <img src={product.image} alt={product.name} className="admin-products__thumb" />
                </td>
                <td className="td-bold">{product.name}</td>
                <td><span className="admin-tag">{product.category}</span></td>
                <td className="td-bold">${product.price?.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>
                  <span className={`status ${product.stock > 0 ? 'status--delivered' : 'status--cancelled'}`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-action-btn admin-action-btn--edit" onClick={() => openEdit(product)} title="Edit"><FiEdit2 /></button>
                    <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleDelete(product.id)} title="Delete"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-field admin-field--full">
                  <label>Product Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="admin-field">
                  <label>Price *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} required />
                </div>
                <div className="admin-field">
                  <label>Original Price *</label>
                  <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => setForm(p => ({ ...p, originalPrice: e.target.value }))} required />
                </div>
                <div className="admin-field">
                  <label>Discount %</label>
                  <input type="number" value={form.discount} onChange={(e) => setForm(p => ({ ...p, discount: e.target.value }))} />
                </div>
                <div className="admin-field">
                  <label>Stock *</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} required />
                </div>
                <div className="admin-field">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div className="admin-field">
                  <label>Age Range</label>
                  <input type="text" value={form.ageRange} onChange={(e) => setForm(p => ({ ...p, ageRange: e.target.value }))} placeholder="e.g. 3-10" />
                </div>
                <div className="admin-field admin-field--full">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
                <div className="admin-field admin-field--full">
                  <label><FiImage /> Product Image *</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {form.image && <img src={form.image} alt="Preview" className="admin-field__preview" />}
                  <input type="text" value={form.image} onChange={(e) => setForm(p => ({ ...p, image: e.target.value }))} placeholder="Or paste image URL" className="mt-2" />
                </div>
                <div className="admin-field admin-field--full admin-checkboxes">
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm(p => ({ ...p, featured: e.target.checked }))} /> Featured
                  </label>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={form.newArrival} onChange={(e) => setForm(p => ({ ...p, newArrival: e.target.checked }))} /> New Arrival
                  </label>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm(p => ({ ...p, bestSeller: e.target.checked }))} /> Best Seller
                  </label>
                </div>
              </div>
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary">{editing ? 'Update' : 'Add'} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
