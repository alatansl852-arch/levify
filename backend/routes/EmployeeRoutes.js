const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET ALL EMPLOYEES
// HR and OVCAF can see all 200 employees
// OVCAA can see only faculty (100)
router.get('/all', async (req, res) => {
  try {
    console.log('📋 Fetching all employees...');
    
    const [employees] = await db.query(`
      SELECT 
        id,
        employee_id,
        full_name,
        email,
        department,
        position,
        employee_type,
        employment_type,
        vacation_leave_balance,
        sick_leave_balance,
        special_privilege_leave_balance,
        forced_leave_balance,
        role
      FROM users
      WHERE role = 'employee'
      ORDER BY full_name ASC
    `);
    
    console.log('✅ Found', employees.length, 'employees');
    
    res.json({
      success: true,
      employees: employees,
      count: employees.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees: ' + error.message
    });
  }
});

// GET SINGLE EMPLOYEE DETAILS
router.get('/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    console.log('📋 Fetching employee:', employee_id);
    
    const [employees] = await db.query(`
      SELECT 
        id,
        employee_id,
        full_name,
        email,
        department,
        position,
        employee_type,
        employment_type,
        vacation_leave_balance,
        sick_leave_balance,
        special_privilege_leave_balance,
        forced_leave_balance,
        role,
        salary_grade
      FROM users
      WHERE employee_id = $1
    `, [employee_id]);
    
    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log('✅ Found employee:', employees[0].full_name);
    
    res.json({
      success: true,
      employee: employees[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee: ' + error.message
    });
  }
});

module.exports = router;