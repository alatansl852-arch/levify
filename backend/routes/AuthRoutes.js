const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔵 Login attempt for:', email);
    
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()] // FIX 1: lowercase email
    );
    
    console.log('🔵 Found users:', users.length);
    
    if (users.length === 0) {
      console.log('🔴 User not found');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    const user = users[0];
    console.log('🔵 User found:', user.email, 'Role:', user.role);
    
    if (password !== user.password) {
      console.log('🔴 Password mismatch');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    console.log('✅ Password correct');
    
    const token = jwt.sign(
      { 
        id: user.id,
        employee_id: user.employee_id, // FIX 2: add employee_id to JWT
        email: user.email, 
        role: user.role,
        employee_type: user.employee_type // FIX 2: add employee_type to JWT
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      department: user.department,
      position: user.position,
      employeeId: user.employee_id,
      employmentType: user.employment_type,
      employee_type: user.employee_type,
      salary_grade: user.salary_grade,
      total_leave_credits: parseFloat(user.total_leave_credits) || 0,
      total_leave_availed: parseFloat(user.total_leave_availed) || 0,
    };
    
    console.log('✅ Login successful for:', userResponse.name);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token: token
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
});

module.exports = router;