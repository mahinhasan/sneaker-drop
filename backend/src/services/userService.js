const User = require('../models/User');

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
        const { id, user } = userData;
        
        let dbUser = await User.findByPk(id);
        
        if (!dbUser) {
            // Create new user
            dbUser = await User.create({
                ...userData,
                user: user || id.split('-')[1] || 'anonymous', // Ensure user is always set
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
        } else if (user && dbUser.user !== user) {
            // Update existing user if user field is missing or different
            dbUser.user = user;
            await dbUser.save();
            return {
                error: false,
                statusCode: 200,
                message: 'User updated successfully',
                data: dbUser
            };
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
    getUserById
};