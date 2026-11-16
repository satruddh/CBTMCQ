
const userModel = require('../../../database/models/users')
const bcrypt = require('bcrypt');
const findUser =require('./userManager').findUser;

const loginService = async (username, password, userRole) => {
    try {
        // Find user by email
        let userExist = await findUser(username);

        console.log('User found:', userExist);

        if (!userExist.success || !userExist.user) {
            throw new Error('User not found')
        }
        console.log("Password to compare:", password, typeof password);
        console.log("User password:", userExist.user.password, typeof userExist.user.password);
        // Check password
        const isMatch = await bcrypt.compare(password, userExist.user.password);
        console.log("Password match result:", isMatch);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Get user details
        if (userExist.user.role.trim() !== userRole.trim().toUpperCase()) {
            throw new Error(`User is not a ${userRole}`);
        }

        return {
            success: true,
            message: 'Login successful',
            user : userExist.user,
        }
    } catch (error) {
        console.error('Login failed:', error);
        return {
            success: false,
            error: error.message,
            message: `Login failed: ${error.message}`
        };
    }
}

module.exports = loginService;