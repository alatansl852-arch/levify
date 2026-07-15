const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all notifications for a user
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    console.log('🔔 Fetching notifications for user:', user_id);
    
    const [notifications] = await db.query(
      `SELECT 
        n.*,
        la.application_number,
        la.employee_id as app_employee_id,
        u.full_name as employee_name
       FROM notifications n
       LEFT JOIN leave_applications la ON n.leave_application_id = la.id
       LEFT JOIN users u ON la.employee_id = u.employee_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [user_id]
    );
    
    console.log('✅ Found', notifications.length, 'notifications');
    
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET unread count
router.get('/user/:user_id/unread-count', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const [result] = await db.query(
      `SELECT COUNT(*) as unread_count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [user_id]
    );
    
    const unreadCount = parseInt(result[0].unread_count) || 0;
    
    res.json({ success: true, unread_count: unreadCount });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.patch('/:notification_id/read', async (req, res) => {
  try {
    const { notification_id } = req.params;
    
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [notification_id]
    );
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read for a user
router.patch('/user/:user_id/read-all', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [user_id]
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;