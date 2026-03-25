const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getApplicationsForJob,
  getMyApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/:jobId', protect, authorize('jobseeker'), applyToJob);
router.get('/job/:jobId', protect, authorize('employer'), getApplicationsForJob);
router.get('/me', protect, authorize('jobseeker'), getMyApplications);
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus);

module.exports = router;
