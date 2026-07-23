const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Helper: get date filter based on period
const getPeriodFilter = (period) => {
  switch (period) {
    case 'daily':   return "AND created_at >= NOW() - INTERVAL '1 day'";
    case 'weekly':  return "AND created_at >= NOW() - INTERVAL '7 days'";
    case 'monthly': return "AND created_at >= NOW() - INTERVAL '1 month'";
    case 'quarterly': return "AND created_at >= NOW() - INTERVAL '3 months'";
    case 'yearly':  return "AND created_at >= NOW() - INTERVAL '1 year'";
    default:        return '';
  }
};

// GET summary statistics
router.get('/summary', async (req, res) => {
  try {
    const period = req.query.period || '';
    const filter = getPeriodFilter(period);

    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total FROM leave_applications WHERE 1=1 ${filter}`
    );
    const [approvedResult] = await db.query(
      `SELECT COUNT(*) as approved FROM leave_applications WHERE status = 'approved' ${filter}`
    );
    const [pendingResult] = await db.query(
      `SELECT COUNT(*) as pending FROM leave_applications 
       WHERE status NOT IN ('approved', 'rejected', 'hr_rejected', 'ovcaa_rejected') ${filter}`
    );
    const [rejectedResult] = await db.query(
      `SELECT COUNT(*) as rejected FROM leave_applications 
       WHERE status IN ('rejected', 'hr_rejected', 'ovcaa_rejected') ${filter}`
    );

    // ✅ FIX: EXTRACT(DAY FROM interval) only returns WHOLE/complete days.
    // For fast-processed test/demo records (approved within minutes or hours),
    // that always rounds down to 0, making the average look permanently 0.0
    // even though real processing time exists.
    //
    // Using EXTRACT(EPOCH FROM interval) / 86400.0 gives the fractional number
    // of days (e.g. 5 minutes -> ~0.0035 days) so the average reflects actual
    // elapsed time instead of truncating everything under 24h to zero.
    const [avgResult] = await db.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (ovcaf_action_date - created_at)) / 86400.0) as avg_days
       FROM leave_applications 
       WHERE status = 'approved' AND ovcaf_action_date IS NOT NULL ${filter}`
    );

    res.json({
      success: true,
      summary: {
        totalRequests: parseInt(totalResult[0].total) || 0,
        approved: parseInt(approvedResult[0].approved) || 0,
        pending: parseInt(pendingResult[0].pending) || 0,
        rejected: parseInt(rejectedResult[0].rejected) || 0,
        avgProcessingDays: parseFloat(avgResult[0].avg_days) || 0,
      }
    });
  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET leave distribution by type
router.get('/distribution', async (req, res) => {
  try {
    const period = req.query.period || '';
    const filter = getPeriodFilter(period);

    const [results] = await db.query(
      `SELECT leave_type, COUNT(*) as count
       FROM leave_applications WHERE 1=1 ${filter}
       GROUP BY leave_type ORDER BY count DESC`
    );

    const total = results.reduce((sum, row) => sum + parseInt(row.count), 0);
    const distribution = results.map(row => ({
      type: row.leave_type,
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0,
    }));

    res.json({ success: true, distribution });
  } catch (error) {
    console.error('❌ Error fetching distribution:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET department statistics
router.get('/departments', async (req, res) => {
  try {
    const period = req.query.period || '';
    const laFilter = period ? getPeriodFilter(period).replace('AND created_at', 'AND la.created_at') : '';

    const [departments] = await db.query(
      `SELECT 
        u.department,
        COUNT(DISTINCT u.id) as employee_count,
        COUNT(la.id) as total_requests,
        COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN la.status NOT IN ('approved', 'rejected', 'hr_rejected', 'ovcaa_rejected') THEN 1 END) as pending_count,
        COALESCE(AVG(CASE WHEN la.status = 'approved' THEN la.days_count END), 0) as avg_days_used
       FROM users u
       LEFT JOIN leave_applications la ON u.employee_id = la.employee_id ${laFilter}
       WHERE u.role IN ('staff', 'faculty')
       GROUP BY u.department
       ORDER BY total_requests DESC`
    );

    const stats = departments.map(dept => ({
      department: dept.department,
      employees: parseInt(dept.employee_count) || 0,
      totalRequests: parseInt(dept.total_requests) || 0,
      approved: parseInt(dept.approved_count) || 0,
      pending: parseInt(dept.pending_count) || 0,
      avgDaysUsed: parseFloat(dept.avg_days_used).toFixed(1),
    }));

    res.json({ success: true, departments: stats });
  } catch (error) {
    console.error('❌ Error fetching department stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET employee leave records
router.get('/employees', async (req, res) => {
  try {
    const period = req.query.period || '';
    const filter = getPeriodFilter(period);

    const [results] = await db.query(
      `SELECT 
        la.employee_id,
        u.name as employee_name,
        u.department,
        u.position,
        la.leave_type,
        la.start_date,
        la.end_date,
        la.days_count,
        la.status,
        la.created_at
       FROM leave_applications la
       JOIN users u ON la.employee_id = u.employee_id
       WHERE 1=1 ${filter}
       ORDER BY la.created_at DESC`
    );

    res.json({ success: true, employees: results });
  } catch (error) {
    console.error('❌ Error fetching employee records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET leave balances
router.get('/balances', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT 
        u.employee_id,
        u.name as employee_name,
        u.department,
        lb.vacation_leave,
        lb.sick_leave,
        lb.total_used
       FROM users u
       LEFT JOIN leave_balances lb ON u.id = lb.user_id
       WHERE u.role IN ('staff', 'faculty')
       ORDER BY u.department, u.name`
    );

    res.json({ success: true, balances: results });
  } catch (error) {
    console.error('❌ Error fetching balances:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET monetization records
router.get('/monetization', async (req, res) => {
  try {
    const period = req.query.period || '';
    const filter = getPeriodFilter(period);

    const [results] = await db.query(
      `SELECT 
        la.employee_id,
        u.name as employee_name,
        u.department,
        la.monetization_days,
        la.monetization_amount as amount,
        la.status,
        la.created_at
       FROM leave_applications la
       JOIN users u ON la.employee_id = u.employee_id
       WHERE la.is_monetization = true ${filter}
       ORDER BY la.created_at DESC`
    );

    res.json({ success: true, monetization: results });
  } catch (error) {
    console.error('❌ Error fetching monetization:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;