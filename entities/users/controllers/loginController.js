const loginService = require('../services/loginService');

const PostReq = async (req, res) => {
    try {
        let username = req.body.username.trim();
        let password = req.body.password.trim();
        let userRole = req.body.role.trim();

        if (!username || !password || !userRole) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        console.log('Received POST request:', req.body);
        console.log('username:', username, typeof username);
        console.log('password:', password, typeof password);
        console.log('userRole:', userRole, typeof userRole);

        // Call the login service
        const user = await loginService(username, password, userRole);

        if (user.success) {
            req.session.authenticatedUser = {
                ...user
            }
            req.session.isAuthenticated = true;
            return res.status(200).json({ message: 'Login successful', user: user.user });

        } else {
            return res.status(401).json({
                message: 'Invalid credentials',
                ...user
            });
        }
    } catch (error) {
        console.error('Error in PostReq:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const GetReq = async (req, res) => {
    res.status(200).json({
        message: 'GET request successful',

    });
}

module.exports.PostReq = PostReq;
module.exports.GetReq = GetReq;
