import React, { useState } from 'react';
import { FiUser, FiMail, FiLock, FiBriefcase } from 'react-icons/fi';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const OnboardDoctor = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', specialization: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.specialization) {
      return toast.error('All fields are required');
    }

    try {
      setLoading(true);

      // Step 1: Create User account with DOCTOR role (admin-protected endpoint)
      const signupRes = await adminService.createDoctorUser({
        username: formData.email,
        password: formData.password,
        name: formData.name,
        roles: ['DOCTOR'],
      });

      const userId = signupRes?.id;
      if (!userId) throw new Error('User creation did not return a valid user ID');

      // Step 2: Create Doctor profile linked to the new user
      await adminService.onboardDoctor({
        userId,
        name: formData.name,
        email: formData.email,
        specialization: formData.specialization,
      });

      toast.success(`Dr. ${formData.name} onboarded successfully!`);
      setFormData({ name: '', email: '', password: '', specialization: '' });

    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to onboard doctor';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Onboard New Doctor</h1>
        <p className="page-subtitle">Create a new doctor profile and system account.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form className="card-body" onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Full Name</label>
            <div className="search-bar">
              <FiUser className="search-icon" />
              <input type="text" name="name" className="form-control" placeholder="Jane Smith" value={formData.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address / Username</label>
            <div className="search-bar">
              <FiMail className="search-icon" />
              <input type="email" name="email" className="form-control" placeholder="jane.smith@hospital.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Temporary Password</label>
            <div className="search-bar">
              <FiLock className="search-icon" />
              <input type="password" name="password" className="form-control" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
            <span className="form-hint">Doctor can change this later</span>
          </div>

          <div className="form-group">
            <label>Specialization</label>
            <div className="search-bar">
              <FiBriefcase className="search-icon" />
              <input type="text" name="specialization" className="form-control" placeholder="e.g. Cardiology, Pediatrics" value={formData.specialization} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : 'Register Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardDoctor;
