import { Router } from 'express';
import {
  getContracts,
  getContractById,
  getContractObligations,
  createContract,
  updateContract,
  analyzeContract
} from '../controllers/contract.controller.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', getContracts);
router.post('/', createContract);
router.post('/analyze', upload.single('file'), analyzeContract);
router.get('/:id', getContractById);
router.patch('/:id', updateContract);
router.get('/:id/obligations', getContractObligations);

export default router;
