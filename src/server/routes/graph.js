const router = require('express').Router();
const packagesController = require('../controllers/packages.controller');

router.get('/packages/:name/:version', packagesController.getPackageGraph);

module.exports = router;
