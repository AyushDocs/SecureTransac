import jwt from 'jsonwebtoken';
import rbacService from '../services/rbacService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secure-transac-super-secret-key-123';

/**
 * Protect routes - verify JWT token
 */
export const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Enrich with RBAC data
        const rbacData = rbacService.getUserRoles(decoded.address);
        
        req.user = {
            ...decoded,
            roles: rbacData.roles,
            activeRole: rbacData.activeRole,
            // Backward compatibility: keep single 'role' field
            role: rbacData.activeRole || decoded.role
        };
        
        next();
    } catch (error) {
        console.error('[SecureTransac] JWT Verification failed:', error.message);
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

/**
 * Restrict to specific roles (legacy - single role check)
 * Backward compatible with existing code
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Check if user has ANY of the required roles
        const userRoles = req.user.roles || [req.user.role];
        const hasRole = roles.some(role => userRoles.includes(role));
        
        if (!hasRole) {
            return res.status(403).json({ 
                error: `None of your roles (${userRoles.join(', ')}) are authorized to access this route. Required: ${roles.join(' or ')}` 
            });
        }
        next();
    };
};

/**
 * Require specific active role (for dashboard-specific routes)
 * User must have switched to this dashboard context
 */
export const requireActiveRole = (...roles) => {
    return (req, res, next) => {
        const activeRole = req.user.activeRole;
        
        if (!roles.includes(activeRole)) {
            return res.status(403).json({ 
                error: `Active role (${activeRole}) is not authorized. Please switch to: ${roles.join(' or ')}`,
                code: 'WRONG_DASHBOARD_CONTEXT'
            });
        }
        next();
    };
};

/**
 * Require user to HAVE a role (doesn't need to be active)
 * More permissive than restrictTo
 */
export const requireRole = (...requiredRoles) => {
    return (req, res, next) => {
        const hasPermission = rbacService.hasPermission(req.user.address, requiredRoles[0]);
        
        if (!hasPermission) {
            return res.status(403).json({ 
                error: `You do not have the required role: ${requiredRoles.join(' or ')}`
            });
        }
        next();
    };
};

/**
 * Admin only middleware
 */
export const adminOnly = (req, res, next) => {
    const userRoles = req.user.roles || [req.user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('deployer');
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * Creator (company) or higher middleware
 */
export const creatorOrHigher = (req, res, next) => {
    const userRoles = req.user.roles || [req.user.role];
    const allowed = ['admin', 'deployer', 'company'];
    const hasAccess = userRoles.some(r => allowed.includes(r));
    
    if (!hasAccess) {
        return res.status(403).json({ error: 'Creator or higher access required' });
    }
    next();
};

