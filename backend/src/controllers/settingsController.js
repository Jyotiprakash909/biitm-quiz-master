const Settings = require('../models/Settings');

// @desc    Get Global Settings
// @route   GET /api/settings
// @access  Public (so frontend can apply theme, but you can restrict it)
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Global Settings
// @route   PUT /api/settings
// @access  Private (Admin)
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    
    // Update fields
    const fields = [
      'institutionName', 'institutionLogo', 'primaryColor', 'secondaryColor', 
      'defaultPassPercentage', 'defaultDurationMinutes', 'pdfHeader', 'pdfFooter'
    ];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
