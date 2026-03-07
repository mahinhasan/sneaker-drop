const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'sneaker-drop-secret-key';

exports.register = async (req, res) => {
    const result = await userService.createUser(req.body);
    if (result.error) {
        return res.status(result.statusCode).json(result);
    }

    const token = jwt.sign(
        { id: result.data.id, user: result.data.user },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.status(201).json({
        ...result,
        token,
        data: {
            id: result.data.id,
            user: result.data.user,
            fullName: result.data.fullName
        }
    });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: true, statusCode: 400, message: 'Username and password are required.' });
    }

    const result = await userService.authenticateUser(username, password);
    if (result.error) {
        return res.status(result.statusCode).json(result);
    }

    const token = jwt.sign(
        { id: result.data.id, user: result.data.user },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.status(200).json({
        ...result,
        token,
        data: {
            id: result.data.id,
            user: result.data.user,
            fullName: result.data.fullName
        }
    });
};
