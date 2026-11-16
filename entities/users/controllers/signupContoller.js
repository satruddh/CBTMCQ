const bcrypt = require('bcrypt');
const loginService = require('../services/loginService');
const signupUser = require('../services/signupUser');


const PostReq = async (req, res) => {
    try{
        let username = req.body.username.trim();
        let name = req.body.name.trim();
        let email = req.body.email.trim();
        let password = req.body.password.trim();
        let role = req.body.role.trim();
        let academicYear = req.body.academicYear;
        let mobileNumber = req.body.mobileNumber.trim();
        let confirmPassword = req.body.confirmPassword.trim();


        if (!username || !name || !email || !password || !role || !academicYear || !mobileNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create a new user
        const userData = {
            username: username,
            name: name,
            email: email,
            password: hashedPassword,
            role: role.toUpperCase(),
            academicYear: academicYear,
            mobileNumber: mobileNumber
        }

        let newUser  = await signupUser(userData);

        if(newUser.success) {
            return res.status(201).json(newUser);
        }
        else {
            return res.status(400).json(newUser);
        }
    }
    catch (error) {
        console.error('Error in PostReq:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const GetReq = async (req, res) => {
    res.status(200).json({
        message: 'GET request successful',
    });
}

module.exports.GetReq = GetReq;
module.exports.PostReq = PostReq;