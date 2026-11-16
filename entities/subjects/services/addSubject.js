const subjectModel = require("../../../database/models/subjects")
const userModel = require('../../../database/models/users');

const addSubject = async (subjectData) => {
    //subject data should include subjectCode, subjectName, description, academicYear, credits, createdBy(objectId of user)
    try {
        const user = await userModel.findOne({ _id: subjectData.createdBy });
        if (!user) {
            throw new Error('User not found');
        }
        const newSubject = new subjectModel({ ...subjectData, createdBy: user._id });
        try{
            await newSubject.save();
        } catch (error) {
            throw new Error('Error saving subject: ' + error.message);
        }
        return {
            message: 'Subject added successfully',
            subject: newSubject
        };
    } catch (error) {
        return {
            message: 'Error adding subject',
            error: error.message,
            subject: {}
        };
    }
};

module.exports = addSubject
