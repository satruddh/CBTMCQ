const userModel = require('../../../database/models/users')
const bcrypt = require('bcrypt');

module.exports = async function signupUser(userData) {
    // userData has hashed password
    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Create a new user
        const newUser = new userModel({
            ...userData,
        });

        await newUser.save();

        return { 
            ...newUser.toObject(), 
            success: true, 
            message: 'User registered successfully'
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: `Signup failed: ${error.message}`
        }
    }
}