const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    companyLogo: { type: String },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
    },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'remote', 'contract', 'internship'],
      default: 'full-time',
    },
    category: {
      type: String,
      enum: [
        'Technology', 'Marketing', 'Finance', 'Healthcare', 'Education',
        'Design', 'Sales', 'Engineering', 'HR', 'Operations', 'Other'
      ],
      default: 'Technology',
    },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
    },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    skills: [{ type: String }],
    experience: {
      type: String,
      enum: ['Entry Level', '1-2 years', '2-5 years', '5+ years', 'Any'],
      default: 'Any',
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicationsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    deadline: { type: Date },
  },
  { timestamps: true }
);

// Text index for search
JobSchema.index({ title: 'text', description: 'text', company: 'text', skills: 'text' });

module.exports = mongoose.model('Job', JobSchema);
