const subjectsModel = require("../../../database/models/subjects");

const getAllSubjects = async (userId) => {
    try {
        // Fetch all subjects from the database
        const subjects = await subjectsModel.find({ createdBy: userId }).populate('createdBy', 'username email role academicYear');
        
        // Check if subjects were found
        if (!subjects || subjects.length === 0) {
            return { message: "No subjects found for this user", subjects: [] };
        }

        // Return the subjects as array in the response object
        return { message: "Subjects fetched successfully", subjects };
    } catch (error) {
        console.error("Error fetching subjects:", error);
        throw error;
    }
};

module.exports = getAllSubjects;
