const User = require('../models/User');

async function findOrCreateUser(userData) {
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
    } else if (user && dbUser.user !== user) {
        // Update existing user if user field is missing or different
        dbUser.user = user;
        await dbUser.save();
    }
    
    return dbUser;
}

async function getUserById(id) {
    return await User.findByPk(id);
}

module.exports = {
    findOrCreateUser,
    getUserById
};