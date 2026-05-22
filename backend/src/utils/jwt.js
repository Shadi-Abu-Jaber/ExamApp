const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = {
  generateToken,
  verifyToken,
};
