const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subjectCode: { 
        type: String, 
        required: true, 
        unique: true 
    },
    subjectName: { 
        type: String, 
        required: true 
    },
    description: String,
    academicYear: { 
        type: Number, 
        required: true, 
        enum: [1, 2, 3, 4, 5] },
    credits: { type: Number, default: 4 },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);