const express = require('express');
const {
  getTotalEnergy,
  getActiveStreetlights,
  getFaults,
  getEnergyUsage,
  getEnergyAreas,
  exportEnergyUsageCsv,
  getMonthlyReport,
  resolveFault,
} = require('../controllers/metricsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN', 'OPERATOR'));

router.get('/total-energy', getTotalEnergy);
router.get('/active-streetlights', getActiveStreetlights);
router.get('/faults', getFaults);
router.get('/energy-usage', getEnergyUsage);
router.get('/energy-areas', getEnergyAreas);
router.get('/monthly-report', getMonthlyReport);
router.get('/export/energy-usage.csv', requireRole('ADMIN', 'OPERATOR'), exportEnergyUsageCsv);
router.post('/resolve-fault', requireRole('ADMIN'), resolveFault);

module.exports = router;