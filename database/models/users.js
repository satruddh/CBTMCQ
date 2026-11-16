const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, immutable: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'FACULTY', 'STUDENT'], default: 'STUDENT' },
  academicYear: { type: Number, enum: [1, 2, 3, 4, 5], default: 1 },
  isActive: { type: Boolean, default: true },
  mobileNumber: { type: String, required: true, trim: true },
  resetPasswordToken: { type: String, default: null },
  // Single-login enforcement to prevent concurrent session cheating
  activeSessionId: { type: String, default: null },
  lastLoginAt: { type: Date, default: null }
}, {
  timestamps: true,
  strict: true
});

// Strip sensitive fields on serialization
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
