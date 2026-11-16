

const subjects = require("../../../database/models/subjects");
const subjectsModel = require("../../../database/models/subjects")
const userModel = require('../../../database/models/users');

const getAllSubjects = require("../services/getSubjects")

const getSubjectsHandlerPost = async (req, res) => {
    try{
        userId = req.body.userID || req.session.authenticatedUser?._id || req.session.authenticatedUser?.userId;
        console.log("Request body:", req.body);
        console.log("Session authenticated user:", req.session.authenticatedUser);
        console.log("User ID:", userId);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: User not found in session', subjects: [] });
        }

        const subjects = await getAllSubjects(userId);
        return res.status(200).json({
            message: "Subjects fetched successfully",
            subjects: subjects.subjects
        });

    }

    catch(error){
        console.error("Error retrieving user from session:", error);
        return res.status(500).json({ message: 'Internal server error', error: error.message, subjects: [] });
    }
}

module.exports.getSubjectsHandlerPost = getSubjectsHandlerPost