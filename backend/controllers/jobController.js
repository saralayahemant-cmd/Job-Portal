const Job = require('../models/Job');
const { AppError } = require('../utils/errorHandler');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (employer only)
exports.createJob = async (req, res, next) => {
  try {
    req.body.employer = req.user._id;
    req.body.company = req.user.companyName || req.body.company;
    req.body.companyLogo = req.user.companyLogo || req.body.companyLogo;

    const job = await Job.create(req.body);
    res.status(201).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs (with search and filter)
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = async (req, res, next) => {
  try {
    const { search, type, category, location, experience, status, page = 1, limit = 12 } = req.query;

    const query = { status: status || 'open' };

    if (search) {
      query.$text = { $search: search };
    }
    if (type) query.type = type;
    if (category) query.category = category;
    if (experience) query.experience = experience;
    if (location) query.location = { $regex: location, $options: 'i' };

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('employer', 'name companyName companyLogo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'employer',
      'name email companyName companyLogo companyWebsite companyDescription'
    );
    if (!job) return next(new AppError('Job not found', 404));
    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (employer, own jobs)
exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) return next(new AppError('Job not found', 404));

    if (job.employer.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this job', 403));
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (employer, own jobs)
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return next(new AppError('Job not found', 404));

    if (job.employer.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this job', 403));
    }

    await job.deleteOne();
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get jobs posted by the logged-in employer
// @route   GET /api/jobs/my-jobs
// @access  Private (employer)
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};
