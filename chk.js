const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect('mongodb://127.0.0.1:27017/travelgo_new').then(async () => {
    const users = await User.find();
    console.log("All Users:", users.map(u => ({email: u.email, archived: u.isArchived})));
    process.exit(0);
});
