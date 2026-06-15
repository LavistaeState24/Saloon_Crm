import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";

const seedUsers = [
  {
    name: "Super Admin",
    email: "deepthakkar@gmail.com",
    password: "Lavista@4249",
    role: "super-admin",
    phone: "7778910804",
  },
];

const run = async () => {
  try {
    await connectDatabase();

    for (const payload of seedUsers) {
      const existingUser = await User.findOne({ email: payload.email });

      if (existingUser) {
        existingUser.name = payload.name;
        existingUser.role = payload.role;
        existingUser.phone = payload.phone;
        existingUser.password = payload.password;
        await existingUser.save();
        console.log(`Updated ${payload.email}`);
      } else {
        await User.create(payload);
        console.log(`Created ${payload.email}`);
      }
    }

    console.log("User seeding completed");
  } catch (error) {
    console.error("User seeding failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();

