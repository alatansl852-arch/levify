const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// ── FILE UPLOAD CONFIG ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/leave-attachments/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // ✅ UPDATED: Accept all common image formats (including iPhone HEIC/HEIF) plus PDF/DOC
    const allowedTypes = /pdf|jpg|jpeg|png|doc|docx|heic|heif|gif|webp|bmp|tiff/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, or image files (JPG, PNG, HEIC, GIF, WEBP, BMP) are allowed'));
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ── HELPER: Get accurate total_leave_availed ───────────────────────────────────
const getAccurateAvailed = async (employeeId, dbAvailed) => {
  const [usedResult] = await db.query(
    `SELECT COALESCE(SUM(days_count), 0) as total_used 
     FROM leave_applications 
     WHERE employee_id = $1 AND status = 'approved'`,
    [employeeId]
  );
  const liveUsed = parseFloat(usedResult[0]?.total_used) || 0;
  const totalAvailed = Math.max(parseFloat(dbAvailed) || 0, liveUsed);

  if (liveUsed > (parseFloat(dbAvailed) || 0)) {
    await db.query(
      `UPDATE users SET total_leave_availed = $1 WHERE employee_id = $2`,
      [liveUsed, employeeId]
    );
  }

  return totalAvailed;
};

// ── MOBILE LOGIN ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('📱 Mobile login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (users.length === 0) {
      console.log('🔴 User not found');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];
    console.log('🔵 User found:', user.email, 'Role:', user.role);

    if (password !== user.password) {
      console.log('🔴 Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const totalLeaveAvailed = await getAccurateAvailed(user.employee_id, user.total_leave_availed);

    const token = jwt.sign(
      { id: user.id, employee_id: user.employee_id, email: user.email, role: user.role, employee_type: user.employee_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        department: user.department,
        position: user.position,
        employee_type: user.employee_type,
        employment_type: user.employment_type,
        salary_grade: user.salary_grade ?? 'N/A',
        total_leave_credits: parseFloat(user.total_leave_credits) || 0,
        total_leave_availed: totalLeaveAvailed,
        vacation_leave_balance: parseFloat(user.vacation_leave_balance) || 0,
        sick_leave_balance: parseFloat(user.sick_leave_balance) || 0,
        special_privilege_leave_balance: parseFloat(user.special_privilege_leave_balance) || 0,
        forced_leave_balance: parseFloat(user.forced_leave_balance) || 0
      }
    });

  } catch (error) {
    console.error('❌ Mobile login error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── GET PROFILE ────────────────────────────────────────────────────────────────
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📱 Fetching profile for user ID:', userId);

    const result = await db.query(
      `SELECT id, employee_id, full_name, email, department, position,
        employee_type, employment_type, role, salary_grade,
        total_leave_credits, total_leave_availed,
        vacation_leave_balance, sick_leave_balance,
        special_privilege_leave_balance, forced_leave_balance
       FROM users WHERE id = $1`,
      [userId]
    );

    const users = Array.isArray(result) ? result[0] : result.rows;
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    const user = users[0];
    console.log('✅ User found:', user.full_name);

    const totalUsed = await getAccurateAvailed(user.employee_id, user.total_leave_availed);

    res.json({
      success: true,
      profile: {
        id: user.id,
        employee_id: user.employee_id,
        name: user.full_name,
        email: user.email,
        department: user.department,
        position: user.position,
        employee_type: user.employee_type,
        employment_type: user.employment_type,
        role: user.role,
        salary_grade: user.salary_grade ?? 'N/A',
        total_leave_credits: parseFloat(user.total_leave_credits) || 0,
        total_leave_availed: totalUsed,
        leave_balances: {
          vacation: parseFloat(user.vacation_leave_balance) || 0,
          sick: parseFloat(user.sick_leave_balance) || 0,
          special_privilege: parseFloat(user.special_privilege_leave_balance) || 0,
          forced: parseFloat(user.forced_leave_balance) || 0,
          total_used: totalUsed
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── GET MY LEAVES ──────────────────────────────────────────────────────────────
router.get('/my-leaves', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    console.log('📱 Fetching leave applications for employee:', employeeId);

    const [leaves] = await db.query(
      `SELECT id, application_number, employee_id, leave_type,
        start_date, end_date, days_count, reason, status,
        hr_remarks, ovcaa_remarks, ovcaf_remarks, created_at, updated_at
       FROM leave_applications WHERE employee_id = $1 ORDER BY created_at DESC`,
      [employeeId]
    );

    console.log('✅ Found', leaves.length, 'leave applications');

    res.json({
      success: true,
      leaves: leaves.map(leave => ({
        id: leave.id,
        application_number: leave.application_number,
        leave_type: leave.leave_type,
        date_from: leave.start_date,
        date_to: leave.end_date,
        days_count: parseFloat(leave.days_count) || 0,
        reason: leave.reason,
        status: leave.status,
        approvals: {
          hr: { remarks: leave.hr_remarks },
          ovcaa: { remarks: leave.ovcaa_remarks },
          ovcaf: { remarks: leave.ovcaf_remarks }
        },
        created_at: leave.created_at,
        updated_at: leave.updated_at
      })),
      total: leaves.length
    });
  } catch (error) {
    console.error('❌ Error fetching leaves:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── GET SINGLE LEAVE ───────────────────────────────────────────────────────────
router.get('/leave/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.employee_id;
    const [leaves] = await db.query(
      'SELECT * FROM leave_applications WHERE id = $1 AND employee_id = $2',
      [id, employeeId]
    );
    if (leaves.length === 0) return res.status(404).json({ success: false, message: 'Leave application not found' });

    const leave = leaves[0];
    res.json({
      success: true,
      leave: {
        id:                 leave.id,
        application_number: leave.application_number,
        leave_type:         leave.leave_type,
        date_from:          leave.start_date,
        date_to:            leave.end_date,
        days_count:         parseFloat(leave.days_count) || 0,
        reason:             leave.reason,
        status:             leave.status,
        created_at:         leave.created_at,
        updated_at:         leave.updated_at,
        approvals: {
          hr:    { remarks: leave.hr_remarks    || null },
          ovcaa: { remarks: leave.ovcaa_remarks || null },
          ovcaf: { remarks: leave.ovcaf_remarks || null },
        },
      }
    });
  } catch (error) {
    console.error('❌ Error fetching leave:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── APPLY FOR LEAVE (with file upload) ────────────────────────────────────────
router.post('/apply', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const { leave_type, date_from, date_to, days_count, reason, monetize_credits, commutation_requested } = req.body;

    // ✅ multipart/form-data sends booleans as strings ("true"/"false"), so parse explicitly
    const monetizeCreditsFlag = monetize_credits === 'true' || monetize_credits === true;
    const commutationRequestedFlag = commutation_requested === 'true' || commutation_requested === true;

    console.log('📱 Leave application from:', employeeId);
    console.log('📎 Files received:', req.files ? req.files.length : 0);
    console.log('💰 Monetize credits:', monetizeCreditsFlag, '| Commutation:', commutationRequestedFlag);

    if (!leave_type || !date_from || !date_to || !days_count) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const [users] = await db.query(
      'SELECT vacation_leave_balance, sick_leave_balance, special_privilege_leave_balance, forced_leave_balance FROM users WHERE employee_id = $1',
      [employeeId]
    );

    if (users.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    const user = users[0];
    const requestedDays = parseFloat(days_count);
    let availableBalance = 0;

    switch (leave_type.toLowerCase()) {
      case 'vacation leave': case 'vacation':
        availableBalance = parseFloat(user.vacation_leave_balance) || 0; break;
      case 'sick leave': case 'sick':
        availableBalance = parseFloat(user.sick_leave_balance) || 0; break;
      case 'special privilege leave': case 'special privilege':
        availableBalance = parseFloat(user.special_privilege_leave_balance) || 0; break;
      case 'forced leave': case 'mandatory/forced leave':
        availableBalance = parseFloat(user.forced_leave_balance) || 0; break;
      default:
        availableBalance = requestedDays;
    }

    if (availableBalance < requestedDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${requestedDays} days`
      });
    }

    // ✅ Monetization requires a minimum of 15 days VL balance remaining before excess can be converted (CSC Omnibus Rules)
    if (monetizeCreditsFlag && leave_type.toLowerCase().includes('vacation')) {
      const remainingAfterLeave = availableBalance - requestedDays;
      if (remainingAfterLeave < 15) {
        return res.status(400).json({
          success: false,
          message: `Monetization requires at least 15 days VL balance remaining. You would have ${remainingAfterLeave} days left.`
        });
      }
    }

    const applicationNumber = `LA-${Date.now()}-${employeeId}`;

    const [result] = await db.query(
      `INSERT INTO leave_applications 
       (application_number, employee_id, leave_type, start_date, end_date, 
        days_count, reason, status, current_approver, monetize_credits, commutation_requested, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'hr', $8, $9, NOW()) 
       RETURNING *`,
      [applicationNumber, employeeId, leave_type, date_from, date_to, requestedDays, reason || '', monetizeCreditsFlag, commutationRequestedFlag]
    );

    const leaveAppId = result[0].id;
    console.log('✅ Leave application created:', applicationNumber);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const normalizedPath = file.path.replace(/\\/g, '/');
        await db.query(
          `INSERT INTO leave_attachments (leave_application_id, file_name, file_path, file_size, file_type) VALUES ($1, $2, $3, $4, $5)`,
          [leaveAppId, file.originalname, normalizedPath, file.size, file.mimetype]
        );
        console.log('📎 Saved attachment:', normalizedPath);
      }
      console.log('✅ Attachments saved:', req.files.length);
    } else {
      console.log('📎 No attachments submitted');
    }

    const [hrUsers] = await db.query("SELECT id FROM users WHERE role = 'hr'");
    for (const hrUser of hrUsers) {
      await db.query(
        `INSERT INTO notifications (user_id, leave_application_id, type, title, message) VALUES ($1, $2, 'leave_submitted', 'New Leave Application', 'A new leave application requires your review')`,
        [hrUser.id, leaveAppId]
      );
    }
    console.log('✅ HR notified:', hrUsers.length, 'users');

    const [empUser] = await db.query("SELECT id FROM users WHERE employee_id = $1", [employeeId]);
    if (empUser && empUser.length > 0) {
      await db.query(
        `INSERT INTO notifications (user_id, leave_application_id, type, title, message) VALUES ($1, $2, 'leave_submitted', 'Leave Application Submitted', $3)`,
        [empUser[0].id, leaveAppId, `Your leave application ${applicationNumber} has been submitted and is awaiting HR review.`]
      );
    }

    res.json({ success: true, message: 'Leave application submitted successfully', application: result[0] });

  } catch (error) {
    console.error('❌ Error creating leave application:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── CANCEL LEAVE ───────────────────────────────────────────────────────────────
router.put('/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.employee_id;
    const [leaves] = await db.query('SELECT * FROM leave_applications WHERE id = $1 AND employee_id = $2', [id, employeeId]);
    if (leaves.length === 0) return res.status(404).json({ success: false, message: 'Leave application not found' });
    const leave = leaves[0];
    if (leave.status !== 'pending' && leave.status !== 'recommending_approved') {
      return res.status(400).json({ success: false, message: `Cannot cancel application with status: ${leave.status}` });
    }
    const [result] = await db.query(`UPDATE leave_applications SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`, [id]);
    res.json({ success: true, message: 'Leave application cancelled successfully', application: result[0] });
  } catch (error) {
    console.error('❌ Error cancelling leave:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── STATISTICS ─────────────────────────────────────────────────────────────────
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    console.log('📱 Fetching statistics for:', employeeId);

    const [stats] = await db.query(
      `SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status LIKE '%rejected%' THEN 1 END) as rejected,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN days_count END), 0) as total_days_used
       FROM leave_applications WHERE employee_id = $1`,
      [employeeId]
    );

    // ✅ FIX: Correctly access the nested row from db.query result
    const userResult = await db.query(
      `SELECT COALESCE(total_leave_availed, 0) as total_leave_availed FROM users WHERE employee_id = $1`,
      [employeeId]
    );

    // Handle both [rows] and [[rows]] response shapes
    const userRows = Array.isArray(userResult[0]) ? userResult[0] : userResult;
    const userRow  = Array.isArray(userRows[0])   ? userRows[0]   : userRows;

    console.log('🔍 userRow debug:', JSON.stringify(userRow));

    const dbAvailed     = parseFloat(userRow[0]?.total_leave_availed) || 0;
    const liveUsed      = parseFloat(stats[0]?.total_days_used) || 0;
    const totalDaysUsed = Math.max(dbAvailed, liveUsed);

    console.log('🔍 dbAvailed:', dbAvailed, '| liveUsed:', liveUsed, '| totalDaysUsed:', totalDaysUsed);

    if (liveUsed > dbAvailed) {
      await db.query(
        `UPDATE users SET total_leave_availed = $1 WHERE employee_id = $2`,
        [liveUsed, employeeId]
      );
    }

    res.json({
      success: true,
      statistics: {
        total:               parseInt(stats[0]?.total) || 0,
        approved:            parseInt(stats[0]?.approved) || 0,
        pending:             parseInt(stats[0]?.pending) || 0,
        rejected:            parseInt(stats[0]?.rejected) || 0,
        total_days_used:     totalDaysUsed,
        total_leave_availed: totalDaysUsed
      }
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── GET NOTIFICATIONS ──────────────────────────────────────────────────────────
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📱 Fetching notifications for user:', userId);

    const [notifications] = await db.query(
      `SELECT n.id, n.type, n.title, n.message, n.is_read, n.created_at,
        la.application_number, la.status as leave_status, la.leave_type
       FROM notifications n
       LEFT JOIN leave_applications la ON n.leave_application_id = la.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;
    console.log('✅ Found', notifications.length, 'notifications, unread:', unreadCount);

    res.json({
      success: true,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.is_read,
        created_at: n.created_at,
        application_number: n.application_number,
        leave_status: n.leave_status,
        leave_type: n.leave_type
      })),
      unread_count: unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── MARK SINGLE NOTIFICATION AS READ ──────────────────────────────────────────
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('❌ Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── MARK ALL NOTIFICATIONS AS READ ────────────────────────────────────────────
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ── VERIFY TOKEN ───────────────────────────────────────────────────────────────
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await db.query('SELECT id, employee_id, full_name, email, role, employee_type FROM users WHERE id = $1', [userId]);
    if (users.length === 0) return res.status(401).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ── LOGOUT ─────────────────────────────────────────────────────────────────────
router.post('/logout', authenticateToken, (req, res) => {
  console.log('📱 User logged out:', req.user.email);
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;