const managerService = require("../services/userManager")

const deletePostReq = async(req, res) => {
    try{
        let userExists = await managerService.findUser(req.body.username);
        console.log('User exists:', userExists);
        if (!userExists.success || !userExists.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let deleteUser = await managerService.deleteUser(userExists.user.email);
        if (deleteUser.success) {
            return res.status(200).json({ message: 'User deleted successfully' });
        }
        else {
            return res.status(400).json(deleteUser);
        }
    }
    catch (error) {
        console.error('Error in deletePostReq:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const updatePostReq = async(req, res) => {
    try {
        let userExists = await managerService.findUser(req.body.username);
        if (!userExists.success || !userExists.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Fetch the provided fields and trim them
        // If a field is not provided, use the existing value from the user object
        // If a field is provided, trim it to remove any leading or trailing whitespace
        let newUsername = req.body.username ? req.body.username.trim() : null;
        let newName = req.body.name ? req.body.name.trim() : null;
        let newEmail = req.body.email ? req.body.email.trim() : null;
        let newRole = req.body.role ? req.body.role.trim().toUpperCase() : null;
        let newAcademicYear = req.body.academicYear ? req.body.academicYear : null;
        let newMobileNumber = req.body.mobileNumber ? req.body.mobileNumber.trim() : null;
        let newPassword = req.body.password ? await bcrypt.hash(req.body.password.trim(),10) : null;

        // Create a new user data object with the updated values
        // If a field is not provided, use the existing value from the user object
        // Pass the hashed password
        let newUserData = {
            username: newUsername ? newUsername : userExists.user.username,
            name: newName ? newName : userExists.user.name,
            email: newEmail ? newEmail : userExists.user.email,
            role: newRole ? newRole : userExists.user.role,
            academicYear: newAcademicYear ? newAcademicYear : userExists.user.academicYear,
            mobileNumber: newMobileNumber ? newMobileNumber : userExists.user.mobileNumber,
            isActive: req.body.isActive !== undefined ? req.body.isActive : userExists.user.isActive,
            password: newPassword ? newPassword : userExists.user.password
        }

        console.log('User exists:', userExists.user);
        console.log('Updating user with data:', newUserData);

        let updatedUser = await managerService.modifyUser(newUserData);
        if (updatedUser.success) {
            return res.status(200).json({ message: 'User updated successfully', user: updatedUser.user });
        }
        else {
            return res.status(400).json(updatedUser);
        }
    }
    catch (error) {
        console.error('Error in UpdatePostReq:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = {
    deletePostReq,
    updatePostReq
};  