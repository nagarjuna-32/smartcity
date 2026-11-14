import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tumakuru-smart-city-jwt-secret-key-2026';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Access forbidden: Administrative privilege required.' });
    }
    next();
  });
}

export function plannerOrAdminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Planner') {
      return res.status(403).json({ error: 'Access forbidden: Urban Planner or Administrator privilege required.' });
    }
    next();
  });
}
