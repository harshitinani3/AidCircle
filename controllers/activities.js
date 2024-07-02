const Activity = require('../models/activity');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
    const activities = await Activity.find({}).populate('popupText');
    res.render('activities/index', { activities })
}

module.exports.renderNewForm = (req, res) => {
    res.render('activities/new');
}

module.exports.createActivity = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.activity.location,
        limit: 1
    }).send()
    const activity = new Activity(req.body.activity);
    activity.geometry = geoData.body.features[0].geometry;
    activity.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    activity.author = req.user._id;
    await activity.save();
    console.log(activity);
    req.flash('success', 'Successfully made a new activity!');
    res.redirect(`/activities/${activity._id}`)
}

module.exports.showActivity = async (req, res,) => {
    const activity = await Activity.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!activity) {
        req.flash('error', 'Cannot find that activity!');
        return res.redirect('/activities');
    }
    res.render('activities/show', { activity });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const activity = await Activity.findById(id)
    if (!activity) {
        req.flash('error', 'Cannot find that activity!');
        return res.redirect('/activities');
    }
    res.render('activities/edit', { activity });
}

module.exports.updateActivity = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const activity = await Activity.findByIdAndUpdate(id, { ...req.body.activity });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    activity.images.push(...imgs);
    await activity.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await activity.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated activity!');
    res.redirect(`/activities/${activity._id}`)
}

module.exports.deleteActivity = async (req, res) => {
    const { id } = req.params;
    await Activity.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted activity')
    res.redirect('/activities');
}
