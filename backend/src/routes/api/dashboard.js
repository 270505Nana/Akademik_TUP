import express from 'express';
import { 
  getAdminDashboard, 
  getDosenDashboard, 
  getMahasiswaDashboard 
} from '../../controllers/dashboardController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin, isDosen, isMahasiswa } from '../../middlewares/authorize.js'; 

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API terpusat untuk data Dashboard SIMTA
 */

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Mendapatkan data agregasi untuk Dashboard Admin
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data dashboard admin
 */
router.get('/admin', verifyToken, isAdmin, getAdminDashboard);

/**
 * @swagger
 * /api/dashboard/dosen:
 *   get:
 *     summary: Mendapatkan data agregasi untuk Dashboard Dosen
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data dashboard dosen
 */
router.get('/dosen', verifyToken, isDosen, getDosenDashboard);

/**
 * @swagger
 * /api/dashboard/mahasiswa:
 *   get:
 *     summary: Mendapatkan data agregasi untuk Dashboard Mahasiswa
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data dashboard mahasiswa
 */
router.get('/mahasiswa', verifyToken, isMahasiswa, getMahasiswaDashboard);

export default router;