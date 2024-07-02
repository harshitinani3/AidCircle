const express = require('express');
const router = express.Router();
const activities = require('../controllers/activities');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateActivity } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const Activity = require('../models/activity');

router.route('/')
    .get(catchAsync(activities.index))
    .post(isLoggedIn, upload.array('image'), validateActivity, catchAsync(activities.createActivity))

router.get('/new', isLoggedIn, activities.renderNewForm)

router.route('/:id')
    .get(catchAsync(activities.showActivity))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateActivity, catchAsync(activities.updateActivity))
    .delete(isLoggedIn, isAuthor, catchAsync(activities.deleteActivity));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(activities.renderEditForm))

module.exports = router;
