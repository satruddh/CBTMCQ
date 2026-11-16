const mongoose = require('mongoose');
const subjects = require('./subjects');

const mySchemaForQuestions = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: new mongoose.Types.ObjectId()
    },
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    difficultyLevel: {
        type: String,
        enum: ['EASY', 'MEDIUM', 'HARD'],
        default: 'MEDIUM'
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    options: [{
        optionId : {
            type: mongoose.Schema.Types.ObjectId,
            default: new mongoose.Types.ObjectId()
        },
        optionText: {
            type: String,
            required: true,
            trim: true
        },
        isCorrect: {
            type: Boolean,
            default: false
        }
    }],
    }, { timestamps: true });
