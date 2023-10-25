const jwt = require('jsonwebtoken');
const config = require('../config/config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Token not found.' });
  }
  
  const token = authHeader.split(' ')[1];

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Access denied. Invalid token.' });
    }
    req.user = user;
    next();
  });
}


function hasRole(role) {
  return (req, res, next) => {
    if (req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: `Access denied. Requires ${role} role.` });
    }
  };
}

module.exports = {
  authenticateToken,
  hasRole,
};