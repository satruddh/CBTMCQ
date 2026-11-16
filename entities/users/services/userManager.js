const userModel = require('../../../database/models/users');
const bcrypt = require('bcrypt');

const modifyUser = async (newUserData) => {
    // newUserData should contain the updated user information
    // It has hashed password, no need to hash it again
    try {
        const user = await userModel.findOne({ email: newUserData.email });

        if (!user) {
            throw new Error('User not found');
        }

        // Update user data
        user.username = newUserData.username || user.username;
        user.name = newUserData.name || user.name;
        user.email = newUserData.email || user.email;
        user.role = newUserData.role || user.role;
        user.academicYear = newUserData.academicYear || user.academicYear;
        user.mobileNumber = newUserData.mobileNumber || user.mobileNumber;
        user.isActive = newUserData.isActive !== undefined ? newUserData.isActive : user.isActive;
        user.password = newUserData.password || user.password;

        // Save the updated user
        await user.save();

        return {
            success: true,
            user: user.toObject(),
            message: 'User updated successfully'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: `Error updating user: ${error.message}`
        };
    }
};

const deleteUser = async (email) => {
    try {
        const user = await userModel.findOneAndDelete({ email });
       if (!user) {
           throw new Error('User not found');
       }
       return {
           success: true,
           message: 'User deleted successfully'
       };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: `Error deleting user: ${email}`
        };
    }
};

const findUser = async function (username) {
    try {
        const user = await userModel.findOne({
            $or: [
                { "username": username },
                { "email": username }
            ]
        });
        return {
            success: true,
            user: user ? user.toObject() : null,
            message: user ? 'User found' : 'User not found'
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: `Error finding user: ${error.message}`
        };
    }
};

module.exports = {
    findUser,
    modifyUser,
    deleteUser
};