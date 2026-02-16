import dbConnect from './lib/db.js';
import User from './models/User.js';

async function test() {
    try {
        console.log("Testing Atlas Connection...");
        await dbConnect();
        console.log("Connected! Fetching user count...");
        const count = await User.countDocuments();
        console.log(`Connection Successful. Found ${count} users in Atlas.`);
        process.exit(0);
    } catch (err) {
        console.error("Connection Failed:", err.message);
        process.exit(1);
    }
}

test();
