

const questionModel = require("../../../database/models/questions")

const addQuestion = async (questionData) => {
    try {

        let questionToAdd = {
            subjectId: questionData.subject,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            difficulty: {
                level: questionData.difficulty,
                weight: questionData.difficulty === 'Easy' ? 0.8 : 
                       questionData.difficulty === 'Medium' ? 1.0 : 1.2
            },
            options: questionData.options,
            createdBy: questionData.createdBy
        };

        const newQuestion = new Question(questionToAdd);
        const savedQuestion = await newQuestion.save();
        return savedQuestion
    }
    catch(error){
        console.log("Error adding question data", error)
        return {}
    }
}

module.exports = addQuestion