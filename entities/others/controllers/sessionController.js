

module.exports.GetReq = async (req, res) => {
    try{
        console.log('Received GET request for session:', req.session);
        if(req.session.authenticatedUser) {
            console.log('Session exists:', req.session.authenticatedUser);
            return res.status(200).json({ message: 'Session exists', user: req.session.authenticatedUser.user });
        }
        else{
            console.log('No session found');
            return res.status(404).json({ message: 'No session found' });
        }
    }
    catch(error) {
        console.error('Error in sessionController:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}