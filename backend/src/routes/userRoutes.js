const express = require('express');

const {
  listUsers,
  listStudents,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

const {
  userCreateValidator,
  userUpdateValidator,
} = require('../validators/userValidator');

const router = express.Router();

router.use(authMiddleware);

/*
  Lecturer needs this endpoint for Assign Students modal.
  It returns STUDENT users only.
*/
router.get('/students', authorize(['ADMIN', 'LECTURER']), listStudents);

/*
  Admin-only user management routes.
*/
router.get('/', authorize(['ADMIN']), listUsers);
router.post('/', authorize(['ADMIN']), userCreateValidator, createUser);
router.patch('/:id', authorize(['ADMIN']), userUpdateValidator, updateUser);
router.delete('/:id', authorize(['ADMIN']), deleteUser);

module.exports = router;