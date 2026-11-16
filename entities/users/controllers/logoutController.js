

module.exports = async function logoutController(req, res) {
    try {
        // Destroy the session to log out the user
        console.log('Logging out user:', req.session.authenticatedUser);
        req.session.authenticatedUser = null; 
        req.session.isAuthenticated = false; 
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: 'Logout successful' });
        });
    } catch (error) {
        console.error('Error in logoutController:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}