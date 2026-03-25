const Application = require('../models/Application');
const Job = require('../models/Job');
const { AppError } = require('../utils/errorHandler');

// @desc    Apply to a job
// @route   POST /api/applications/:jobId
// @access  Private (jobseeker)
exports.applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return next(new AppError('Job not found', 404));
    if (job.status === 'closed') return next(new AppError('This job is no longer accepting applications', 400));

    const existing = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user._id,
    });
    if (existing) return next(new AppError('You have already applied to this job', 400));

    const application = await Application.create({
      job: req.params.jobId,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter,
      resumeUrl: req.body.resumeUrl || req.user.resumeUrl,
    });

    // Increment applications count
    await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicationsCount: 1 } });

    res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for a specific job (employer)
// @route   GET /api/applications/job/:jobId
// @access  Private (employer)
exports.getApplicationsForJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return next(new AppError('Job not found', 404));

    if (job.employer.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to view these applications', 403));
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email bio skills resumeUrl location avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in jobseeker's applications
// @route   GET /api/applications/me
// @access  Private (jobseeker)
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company location type status companyLogo')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (employer)
// @route   PUT /api/applications/:id/status
// @access  Private (employer)
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return next(new AppError('Application not found', 404));

    if (application.job.employer.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this application', 403));
    }

    application.status = req.body.status;
    if (req.body.employerNote) application.employerNote = req.body.employerNote;
    await application.save();

    res.status(200).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};
