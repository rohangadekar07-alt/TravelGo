require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const res = await User.deleteMany({ isArchived: true });
    console.log("Deleted archived users:", res.deletedCount);
    const u = await User.findOne({email: 'rohangadekar07@gmail.com'});
    if(u) {
        await User.deleteOne({email: 'rohangadekar07@gmail.com'});
        console.log("Deleted old rohangadekar account manually");
    }
    console.log("Complete!");
    process.exit(0);
});
