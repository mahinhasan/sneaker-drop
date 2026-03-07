const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function findOrCreateUser(userData) {
    if (!userData || !userData.id) {
        return {
            error: true,
            statusCode: 400,
            message: 'User ID is required.',
            data: null
        };
    }

    try {
        const { id, user, password } = userData;
        
        let dbUser = await User.findByPk(id);
        
        if (!dbUser) {
            // Create new user
            let hashedPassword = null;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                hashedPassword = await bcrypt.hash(password, salt);
            }

            dbUser = await User.create({
                ...userData,
                user: user || id.split('-')[1] || 'anonymous', // Ensure user is always set
                password: hashedPassword,
                status: userData.status ?? true,
                active: userData.active ?? true,
                emails: userData.emails ?? [],
                clinics: userData.clinics ?? []
            });
            return {
                error: false,
                statusCode: 201,
                message: 'User created successfully',
                data: dbUser
            };
        } else {
            // Check if updates are needed (e.g., user field or password if provided)
            let updated = false;
            if (user && dbUser.user !== user) {
                dbUser.user = user;
                updated = true;
            }
            
            if (password) {
                const salt = await bcrypt.genSalt(10);
                dbUser.password = await bcrypt.hash(password, salt);
                updated = true;
            }

            if (updated) {
                await dbUser.save();
                return {
                    error: false,
                    statusCode: 200,
                    message: 'User updated successfully',
                    data: dbUser
                };
            }
        }
        
        return {
            error: false,
            statusCode: 200,
            message: 'User retrieved successfully',
            data: dbUser
        };
    } catch (err) {
        console.error('Error in findOrCreateUser service:', err);
        return {
            error: true,
            statusCode: 500,
            message: 'Internal server error during user initialization.',
            data: null
        };
    }
}

async function createUser(userData) {
    if (!userData.user || !userData.password) {
        return { error: true, statusCode: 400, message: 'Username and password are required.', data: null };
    }

    try {
        const existingUser = await User.findOne({ where: { user: userData.user } });
        if (existingUser) {
            return { error: true, statusCode: 400, message: 'Username already taken.', data: null };
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const newUser = await User.create({
            ...userData,
            id: `user-${Date.now()}`,
            password: hashedPassword
        });

        return { error: false, statusCode: 201, message: 'User registered successfully', data: newUser };
    } catch (err) {
        console.error('Error in createUser service:', err);
        return { error: true, statusCode: 500, message: 'Internal server error during registration.', data: null };
    }
}

async function authenticateUser(username, password) {
    try {
        const user = await User.findOne({ where: { user: username } });
        if (!user || !user.password) {
            return { error: true, statusCode: 401, message: 'Invalid username or password.', data: null };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { error: true, statusCode: 401, message: 'Invalid username or password.', data: null };
        }

        return { error: false, statusCode: 200, message: 'Authentication successful', data: user };
    } catch (err) {
        console.error('Error in authenticateUser service:', err);
        return { error: true, statusCode: 500, message: 'Internal server error during login.', data: null };
    }
}

async function getUserById(id) {
    if (!id) {
        return {
            error: true,
            statusCode: 400,
            message: 'User ID is required.',
            data: null
        };
    }

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return {
                error: true,
                statusCode: 404,
                message: 'User not found.',
                data: null
            };
        }
        return {
            error: false,
            statusCode: 200,
            message: 'User retrieved successfully',
            data: user
        };
    } catch (err) {
        console.error('Error in getUserById service:', err);
        return {
            error: true,
            statusCode: 500,
            message: 'Internal server error while fetching user.',
            data: null
        };
    }
}

module.exports = {
    findOrCreateUser,
    createUser,
    authenticateUser,
    getUserById
};