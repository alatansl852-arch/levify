const bcrypt = require('bcryptjs');

const plainPassword = 'password123';

bcrypt.hash(plainPassword, 10, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('\n======================================');
    console.log('PASSWORD HASH GENERATOR');
    console.log('======================================\n');
    console.log('Plain password:  password123');
    console.log('\nHashed password:\n');
    console.log(hash);
    console.log('\n======================================');
    console.log('INSTRUCTIONS:');
    console.log('======================================');
    console.log('1. Copy the hash above');
    console.log('2. Go to phpMyAdmin');
    console.log('3. Edit Juan Dela Cruz\'s row');
    console.log('4. Paste this hash in the password field');
    console.log('5. Save');
    console.log('6. Login with: password123');
    console.log('======================================\n');
});