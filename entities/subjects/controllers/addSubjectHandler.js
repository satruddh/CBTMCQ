const addSubject = require('../services/addSubject')

const addSubjectHandlerPost = async (req, res) => {
    const subjectName = req.body.subjectName;
    const subjectCode = req.body.subjectCode;
    const academicYear = req.body.academicYear;
    const createdBy = req.body.createdBy; 
    const credits = req.body.credits || 4; 
    const description = req.body.description || ''; 

    // Validate required fields
    if (!subjectCode || !subjectName || !academicYear || !createdBy) {
        return res.status(400).json({ 
            message: 'Missing required fields',
            subjects: []
         });
    }

    let subjectData = {
        subjectCode : subjectCode,
        subjectName : subjectName,
        description : description,
        academicYear : academicYear,
        credits : credits,
        createdBy : createdBy
    }

    try {
        const newSubject = await addSubject(subjectData);
        if (newSubject.error) {
            return res.status(400).json({ 
                message: newSubject.message, 
                error: newSubject.error, 
                subject: {} 
            });
        }
        return res.status(201).json({ message: 'Subject added successfully', subject: newSubject.subject });
    } catch (error) {
        console.error('Error adding subject:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message, subject: {} });
    }
}

module.exports.addSubjectHandlerPost = addSubjectHandlerPost