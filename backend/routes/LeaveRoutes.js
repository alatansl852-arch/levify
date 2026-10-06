const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configure file upload
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
    const allowedTypes = /pdf|jpg|jpeg|png|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, PNG, DOC files are allowed'));
  }
});

// ✅ Helper: safely normalize DB truthy values (works for boolean, '1'/'0' strings, or 1/0 numbers)
const isTruthy = (val) => val === true || val === '1' || val === 1 || val === 't' || val === 'true';

// Helper: notify employee by employee_id
const notifyEmployee = async (employeeId, leaveAppId, type, title, message) => {
  try {
    const [empUsers] = await db.query('SELECT id FROM users WHERE employee_id = $1', [employeeId]);
    if (empUsers.length > 0) {
      await db.query(
        `INSERT INTO notifications (user_id, leave_application_id, type, title, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [empUsers[0].id, leaveAppId, type, title, message]
      );
      console.log('✅ Employee notified:', employeeId, '-', title);
    }
  } catch (err) {
    console.error('❌ Failed to notify employee:', err.message);
  }
};

// Helper: notify next approver group
const notifyApprovers = async (role, leaveAppId, title, message) => {
  try {
    const [approvers] = await db.query('SELECT id FROM users WHERE role = $1', [role]);
    for (const approver of approvers) {
      await db.query(
        `INSERT INTO notifications (user_id, leave_application_id, type, title, message)
         VALUES ($1, $2, 'leave_for_review', $3, $4)`,
        [approver.id, leaveAppId, title, message]
      );
    }
    console.log('✅ Notified', approvers.length, role, 'approver(s)');
  } catch (err) {
    console.error('❌ Failed to notify approvers:', err.message);
  }
};

// DEBUG ENDPOINT
router.get('/debug/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    console.log('🔍 DEBUG: Fetching data for user_id:', user_id);
    const [users] = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
    console.log('🔍 DEBUG: Found users:', users.length);
    if (users.length === 0) return res.json({ success: false, message: 'User not found', user_id });
    const [applications] = await db.query('SELECT * FROM leave_applications WHERE employee_id = $1 ORDER BY created_at DESC', [user_id]);
    const user = users[0];
    res.json({
      success: true,
      debug_info: { user_id, user_found: users.length > 0, applications_count: applications.length },
      user: { id: user.id, name: user.full_name, email: user.email, vacation_leave_balance: user.vacation_leave_balance, sick_leave_balance: user.sick_leave_balance },
      applications,
      balance: { vacation_leave: user.vacation_leave_balance || 0, sick_leave: user.sick_leave_balance || 0, special_privilege_leave: user.special_privilege_leave_balance || 0, forced_leave: user.forced_leave_balance || 0 }
    });
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});

// 1️⃣ SUBMIT LEAVE APPLICATION (Web)
router.post('/apply', upload.array('attachments', 5), async (req, res) => {
  try {
    console.log('📨 Leave application received');
    console.log('Request body:', req.body);
    const { employee_id, leave_type, leave_location, start_date, end_date, days_count, reason, monetize_credits, monetization_vl_days, monetization_sl_days, commutation_requested } = req.body;

    // Also fetch the vacation balance so we can validate the monetization request
    const [users] = await db.query('SELECT id, vacation_leave_balance, sick_leave_balance FROM users WHERE employee_id = $1', [employee_id]);
    if (users.length === 0) return res.status(400).json({ success: false, message: 'Invalid employee ID' });

    // ✅ Validate the VL / SL days to monetize (MSU lets both be monetized).
    // Stay NULL when the employee is not monetizing.
    let monetizationVlDays = null;
    let monetizationSlDays = null;
    let monetizationDays = null; // total = VL + SL
    if (isTruthy(monetize_credits)) {
      const vl = parseFloat(monetization_vl_days) || 0;
      const sl = parseFloat(monetization_sl_days) || 0;
      if (vl < 0 || sl < 0 || vl + sl <= 0) {
        return res.status(400).json({ success: false, message: 'Enter at least 1 day of VL or SL to monetize' });
      }
      const vacationBalance = parseFloat(users[0].vacation_leave_balance) || 0;
      const sickBalance = parseFloat(users[0].sick_leave_balance) || 0;
      if (vl > vacationBalance) {
        return res.status(400).json({
          success: false,
          message: `Not enough vacation leave credits. You can monetize at most ${vacationBalance} VL day(s).`
        });
      }
      if (sl > sickBalance) {
        return res.status(400).json({
          success: false,
          message: `Not enough sick leave credits. You can monetize at most ${sickBalance} SL day(s).`
        });
      }
      monetizationVlDays = vl;
      monetizationSlDays = sl;
      monetizationDays = vl + sl;
    }

    const year = new Date().getFullYear();
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM leave_applications WHERE EXTRACT(YEAR FROM created_at) = $1', [year]);
    const appNumber = `LV-${year}-${String(parseInt(countResult[0].count) + 1).padStart(4, '0')}`;
    const [result] = await db.query(
      `INSERT INTO leave_applications (employee_id, application_number, leave_type, leave_location, start_date, end_date, days_count, reason, monetize_credits, commutation_requested, monetization_days, monetization_vl_days, monetization_sl_days, status, current_approver) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', 'hr') RETURNING id`,
      [employee_id, appNumber, leave_type, leave_location, start_date, end_date, days_count, reason, monetize_credits, commutation_requested, monetizationDays, monetizationVlDays, monetizationSlDays]
    );
    const leaveAppId = result[0].id;
    console.log('✅ Leave application created with ID:', leaveAppId, '| monetization VL/SL:', monetizationVlDays, '/', monetizationSlDays);

    // Save attachments
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
    }

    // Notify HR approvers
    await notifyApprovers('hr', leaveAppId, 'New Leave Application', 'A new leave application requires your review');

    // Notify the employee their application was submitted
    await notifyEmployee(
      employee_id, leaveAppId,
      'leave_submitted',
      'Leave Application Submitted',
      `Your leave application ${appNumber} has been submitted and is awaiting HR review.`
    );

    console.log('✅ Leave application submitted:', appNumber);
    res.json({ success: true, message: 'Leave application submitted successfully', application_number: appNumber, application_id: leaveAppId });
  } catch (error) {
    console.error('❌ Error submitting leave:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2️⃣ GET PENDING REGULAR LEAVE APPLICATIONS
router.get('/pending/:role', async (req, res) => {
  try {
    const { role } = req.params;
    console.log('🔵 Fetching pending REGULAR applications for role:', role);
    const [applications] = await db.query(
      `SELECT la.*, u.full_name as employee_name, u.email, u.department, u.position,
        (SELECT COUNT(*) FROM leave_attachments WHERE leave_application_id = la.id) as attachment_count
       FROM leave_applications la
       JOIN users u ON la.employee_id = u.employee_id
       WHERE la.current_approver = $1
         AND la.status NOT IN ('approved', 'rejected', 'hr_rejected', 'ovcaa_rejected')
         AND (la.monetize_credits = false OR la.monetize_credits IS NULL)
         AND (la.commutation_requested = false OR la.commutation_requested IS NULL)
       ORDER BY la.created_at DESC`,
      [role]
    );
    console.log('✅ Found', applications.length, 'regular pending applications');
    res.json({ success: true, applications });
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET MONETIZATION REQUESTS
router.get('/monetization/:role', async (req, res) => {
  try {
    const { role } = req.params;
    console.log('🔵 Fetching MONETIZATION requests for role:', role);
    const [applications] = await db.query(
      `SELECT la.*, u.full_name as employee_name, u.email, u.department, u.position, u.salary_grade, u.monthly_salary,
        (SELECT COUNT(*) FROM leave_attachments WHERE leave_application_id = la.id) as attachment_count
       FROM leave_applications la
       JOIN users u ON la.employee_id = u.employee_id
       WHERE la.current_approver = $1
         AND la.status NOT IN ('approved', 'rejected', 'hr_rejected', 'ovcaa_rejected')
         AND (la.monetize_credits = true OR la.commutation_requested = true)
       ORDER BY la.created_at DESC`,
      [role]
    );
    console.log('✅ Found', applications.length, 'monetization requests');
    res.json({ success: true, applications });
  } catch (error) {
    console.error('❌ Error fetching monetization requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET EMPLOYEE MONTHLY SALARY (used by the Apply Leave form's monetization estimate)
router.get('/salary/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    const [rows] = await db.query('SELECT monthly_salary FROM users WHERE employee_id = $1', [employee_id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, monthly_salary: rows[0].monthly_salary !== null ? parseFloat(rows[0].monthly_salary) : null });
  } catch (error) {
    console.error('❌ Error fetching salary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3️⃣ PROCESS LEAVE APPLICATION (Approve/Reject)
router.post('/process/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_id, approver_role, action, remarks } = req.body;

    const approverIdInt = parseInt(approver_id);
    if (isNaN(approverIdInt)) {
      return res.status(400).json({ success: false, message: 'Invalid approver ID' });
    }

    console.log('🔵 Processing application:', id, 'Action:', action, 'Approver ID:', approverIdInt);

    const [applications] = await db.query(
      `SELECT la.*, u.full_name as employee_name, u.email as employee_email
       FROM leave_applications la
       JOIN users u ON la.employee_id = u.employee_id
       WHERE la.id = $1`,
      [id]
    );

    if (applications.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });

    const application = applications[0];
    let newStatus, nextApprover, employeeNotifType, employeeNotifTitle, employeeNotifMessage;

    if (action === 'rejected') {
      newStatus             = `${approver_role}_rejected`;
      nextApprover          = null;
      employeeNotifType     = `${approver_role}_rejected`;
      employeeNotifTitle    = 'Leave Application Rejected';
      employeeNotifMessage  = `Your leave application (${application.application_number}) has been rejected by ${approver_role.toUpperCase()}. Remarks: ${remarks || 'None'}`;
    } else if (action === 'approved') {
      if (approver_role === 'hr') {
        newStatus             = 'hr_approved';
        nextApprover          = 'ovcaa';
        employeeNotifType     = 'hr_approved';
        employeeNotifTitle    = '✅ HR Approved';
        employeeNotifMessage  = `Your leave application (${application.application_number}) has been approved by HR and forwarded to OVCAA for review.`;
      } else if (approver_role === 'ovcaa') {
        newStatus             = 'ovcaa_approved';
        nextApprover          = 'ovcaf';
        employeeNotifType     = 'ovcaa_approved';
        employeeNotifTitle    = '✅ OVCAA Approved';
        employeeNotifMessage  = `Your leave application (${application.application_number}) has been approved by OVCAA and forwarded to OVCAF for final approval.`;
      } else if (approver_role === 'ovcaf') {
        newStatus             = 'approved';
        nextApprover          = null;
        employeeNotifType     = 'approved';
        employeeNotifTitle    = '🎉 Leave Fully Approved!';
        employeeNotifMessage  = `Congratulations! Your leave application (${application.application_number}) has been FULLY APPROVED by OVCAF.`;

        // ✅ Update total_leave_availed — add on top of existing value
        await db.query(
          `UPDATE users 
           SET total_leave_availed = COALESCE(total_leave_availed, 0) + $1 
           WHERE employee_id = $2`,
          [application.days_count, application.employee_id]
        );
        console.log('✅ total_leave_availed updated for:', application.employee_id, '+', application.days_count);

        const isMonetized   = isTruthy(application.monetize_credits);
        const isCommutation = isTruthy(application.commutation_requested);

        if (!isCommutation) {

          const leaveTypeMap = {
            'Vacation Leave':            'vacation_leave_balance',
            'Sick Leave':                'sick_leave_balance',
            'Special Privilege Leave':   'special_privilege_leave_balance',
            'Forced Leave':              'forced_leave_balance',
            'Mandatory/Forced Leave':    'forced_leave_balance',
            'vacation leave':            'vacation_leave_balance',
            'sick leave':                'sick_leave_balance',
            'special privilege leave':   'special_privilege_leave_balance',
            'forced leave':              'forced_leave_balance',
            'mandatory/forced leave':    'forced_leave_balance',
          };

          const balanceField = leaveTypeMap[application.leave_type] 
                            || leaveTypeMap[application.leave_type?.toLowerCase()];

          if (balanceField) {
            await db.query(
              `UPDATE users 
               SET ${balanceField} = GREATEST(${balanceField} - $1, 0) 
               WHERE employee_id = $2`,
              [application.days_count, application.employee_id]
            );
            console.log('✅ Leave balance deducted:', balanceField, '-', application.days_count, 'for:', application.employee_id, isMonetized ? '(monetized)' : '(regular)');
          } else {
            console.warn('⚠️ No balance field found for leave type:', application.leave_type);
          }

          // ✅ Monetized credits: VL days come out of the VL balance and SL days
          // out of the SL balance, on top of the leave days deducted above.
          const monetizedVl = parseFloat(application.monetization_vl_days) || 0;
          const monetizedSl = parseFloat(application.monetization_sl_days) || 0;
          if (isMonetized && monetizedVl > 0) {
            await db.query(
              `UPDATE users 
               SET vacation_leave_balance = GREATEST(vacation_leave_balance - $1, 0) 
               WHERE employee_id = $2`,
              [monetizedVl, application.employee_id]
            );
            console.log('✅ Monetized VL deducted:', monetizedVl, 'for:', application.employee_id);
          }
          if (isMonetized && monetizedSl > 0) {
            await db.query(
              `UPDATE users 
               SET sick_leave_balance = GREATEST(sick_leave_balance - $1, 0) 
               WHERE employee_id = $2`,
              [monetizedSl, application.employee_id]
            );
            console.log('✅ Monetized SL deducted:', monetizedSl, 'for:', application.employee_id);
          }
        } else {
          console.log('ℹ️ Commutation — skipping balance deduction');
        }
      }
    }

    const remarksColumn    = `${approver_role}_remarks`;
    const actionDateColumn = `${approver_role}_action_date`;
    const actionByColumn   = `${approver_role}_action_by`;

    await db.query(
      `UPDATE leave_applications SET status = $1, current_approver = $2, ${remarksColumn} = $3, ${actionDateColumn} = NOW(), ${actionByColumn} = $4 WHERE id = $5`,
      [newStatus, nextApprover, remarks, approverIdInt, id]
    );

    await db.query(
      `INSERT INTO approval_history (leave_application_id, approver_id, approver_role, action, remarks) VALUES ($1, $2, $3, $4, $5)`,
      [id, approverIdInt, approver_role, action, remarks]
    );

    await notifyEmployee(
      application.employee_id, id,
      employeeNotifType, employeeNotifTitle, employeeNotifMessage
    );

    if (nextApprover && action === 'approved') {
      await notifyApprovers(
        nextApprover, id,
        'Leave Application for Review',
        `A leave application from ${application.employee_name} requires your review.`
      );
    }

    console.log('✅ Application processed:', action, 'New status:', newStatus);
    res.json({ success: true, message: `Application ${action} successfully`, newStatus, nextApprover });

  } catch (error) {
    console.error('❌ Error processing leave:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4️⃣ GET EMPLOYEE'S APPLICATIONS
router.get('/my-applications/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    console.log('🔵 Fetching applications for employee:', employee_id);
    const [users] = await db.query('SELECT id FROM users WHERE employee_id = $1', [employee_id]);
    if (users.length === 0) return res.json({ success: true, applications: [], message: 'No applications found' });
    const [applications] = await db.query(
      `SELECT la.*, u.full_name as employee_name, u.email, u.department, u.position,
        (SELECT COUNT(*) FROM leave_attachments WHERE leave_application_id = la.id) as attachment_count
       FROM leave_applications la
       JOIN users u ON la.employee_id = u.employee_id
       WHERE la.employee_id = $1
       ORDER BY la.created_at DESC`,
      [employee_id]
    );
    console.log('✅ Found', applications.length, 'applications');
    res.json({ success: true, applications });
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5️⃣ GET APPLICATION DETAILS
router.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔵 Fetching details for application:', id);
    const [applications] = await db.query(
      `SELECT la.*, u.full_name as employee_name, u.email, u.department, u.position, u.employee_id as emp_id
       FROM leave_applications la JOIN users u ON la.employee_id = u.employee_id WHERE la.id = $1`,
      [id]
    );
    if (applications.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });
    const [attachments] = await db.query('SELECT * FROM leave_attachments WHERE leave_application_id = $1', [id]);
    const [history] = await db.query(
      `SELECT ah.*, u.full_name as approver_name FROM approval_history ah JOIN users u ON ah.approver_id = u.id WHERE ah.leave_application_id = $1 ORDER BY ah.created_at ASC`,
      [id]
    );
    console.log('✅ Found application details');
    res.json({ success: true, application: applications[0], attachments, history });
  } catch (error) {
    console.error('❌ Error fetching application details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6️⃣ GET LEAVE BALANCE
router.get('/balance/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    console.log('🔵 Fetching balance for employee:', employee_id);

    const [users] = await db.query(
      `SELECT 
         vacation_leave_balance, 
         sick_leave_balance, 
         special_privilege_leave_balance, 
         forced_leave_balance,
         total_leave_credits,
         total_leave_availed
       FROM users WHERE employee_id = $1`,
      [employee_id]
    );

    if (users.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    const user     = users[0];
    const vacation = parseFloat(user.vacation_leave_balance) || 0;
    const sick     = parseFloat(user.sick_leave_balance) || 0;
    const special  = parseFloat(user.special_privilege_leave_balance) || 0;
    const forced   = parseFloat(user.forced_leave_balance) || 0;

    // ✅ SPLIT: live sum of approved REGULAR (non-monetized, non-commutation) leave only
    const [usedResult] = await db.query(
      `SELECT COALESCE(SUM(days_count), 0) as total_used 
       FROM leave_applications 
       WHERE employee_id = $1 AND status = 'approved'
         AND (monetize_credits = false OR monetize_credits IS NULL)
         AND (commutation_requested = false OR commutation_requested IS NULL)`,
      [employee_id]
    );
    const liveUsed = parseFloat(usedResult[0].total_used) || 0;

    // ✅ live sum of approved MONETIZED days only.
    // Uses the actual monetization_days; falls back to days_count for older
    // rows that were saved before monetization_days existed.
    const [monetizedResult] = await db.query(
      `SELECT COALESCE(SUM(COALESCE(monetization_days, days_count)), 0) as total_monetized 
       FROM leave_applications 
       WHERE employee_id = $1 AND status = 'approved'
         AND monetize_credits = true`,
      [employee_id]
    );
    const liveMonetized = parseFloat(monetizedResult[0].total_monetized) || 0;

    // ✅ Use whichever is larger — protects historically imported data.
    // NOTE: imported historical data (total_leave_availed) has no way to know
    // how much of it was monetized vs. regularly used, so it's treated as
    // "used" by default. Only live (post-launch) monetization requests show
    // up under totalMonetized.
    const dbAvailed = parseFloat(user.total_leave_availed) || 0;
    const totalUsed = Math.max(dbAvailed, liveUsed);

    // Only sync upward — never zero out imported historical data
    if (liveUsed > dbAvailed) {
      await db.query(
        `UPDATE users SET total_leave_availed = $1 WHERE employee_id = $2`,
        [liveUsed, employee_id]
      );
    }

    console.log('✅ Balance - VL:', vacation, 'SL:', sick, 'SPL:', special, 'FL:', forced, 'Used:', totalUsed, 'Monetized:', liveMonetized);

    res.json({
      success: true,
      balance: {
        vacationLeave:     vacation,
        sickLeave:         sick,
        specialPrivilege:  special,
        forcedLeave:       forced,
        totalEarned:       vacation + sick + special + forced,
        totalUsed,                          // regular leave days used only
        totalMonetized:    liveMonetized,   // monetized days only
        totalLeaveCredits: parseFloat(user.total_leave_credits) || 0,
        totalLeaveAvailed: totalUsed + liveMonetized, // kept for backward compat (combined)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7️⃣ GET LEAVE STATISTICS
router.get('/statistics/:employee_id', async (req, res) => {
  try {
    const { employee_id } = req.params;
    console.log('🔵 Fetching statistics for employee:', employee_id);

    const [usedDays] = await db.query(
      `SELECT COALESCE(SUM(days_count), 0) as total_used 
       FROM leave_applications 
       WHERE employee_id = $1 AND status = 'approved' 
       AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [employee_id]
    );

    const [pending] = await db.query(
      `SELECT COUNT(*) as pending_count 
       FROM leave_applications 
       WHERE employee_id = $1 AND status NOT IN ('approved', 'rejected', 'hr_rejected', 'ovcaa_rejected')`,
      [employee_id]
    );

    const [allTimeUsed] = await db.query(
      `SELECT COALESCE(SUM(days_count), 0) as all_time_used 
       FROM leave_applications 
       WHERE employee_id = $1 AND status = 'approved'`,
      [employee_id]
    );

    const [userRow] = await db.query(
      `SELECT COALESCE(total_leave_availed, 0) as total_leave_availed FROM users WHERE employee_id = $1`,
      [employee_id]
    );
    const dbAvailed    = parseFloat(userRow[0]?.total_leave_availed) || 0;
    const liveAllTime  = parseFloat(allTimeUsed[0].all_time_used) || 0;
    const finalAllTime = Math.max(dbAvailed, liveAllTime);

    console.log('✅ Statistics found');
    res.json({
      success: true,
      statistics: {
        total_used:    parseFloat(usedDays[0].total_used) || 0,
        all_time_used: finalAllTime,
        pending_count: parseInt(pending[0].pending_count) || 0
      }
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8️⃣ GET FULL LEAVE HISTORY (with approval trail) — used by the History page
router.get('/history', async (req, res) => {
  try {
    console.log('🔵 Fetching full leave history with approval trail');

    const [applications] = await db.query(
      `SELECT la.*, u.full_name as employee_name, u.department, u.position
       FROM leave_applications la
       JOIN users u ON la.employee_id = u.employee_id
       ORDER BY la.created_at DESC`
    );

    const [historyRows] = await db.query(
      `SELECT ah.leave_application_id, ah.approver_role, ah.action, ah.remarks, ah.created_at,
              u.full_name as approver_name
       FROM approval_history ah
       JOIN users u ON ah.approver_id = u.id
       ORDER BY ah.created_at ASC`
    );

    const historyByApp = {};
    for (const h of historyRows) {
      if (!historyByApp[h.leave_application_id]) historyByApp[h.leave_application_id] = [];
      historyByApp[h.leave_application_id].push(h);
    }

    const result = applications.map(app => ({
      ...app,
      trail: historyByApp[app.id] || []
    }));

    console.log('✅ Found', result.length, 'applications with history');
    res.json({ success: true, applications: result });
  } catch (error) {
    console.error('❌ Error fetching leave history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;