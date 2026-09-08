import bcrypt from "bcryptjs";
import { connectDatabase } from "./shared/config/database.js";
import { ROLES } from "./shared/constants/roles.js";
import { User } from "./components/epic1_user_staff/models/User.js";
import { Staff } from "./components/epic1_user_staff/models/Staff.js";

await connectDatabase();

const email = process.env.SEED_ADMIN_EMAIL || "admin@healthguard.local";
const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

const existing = await User.findOne({ email });
if (existing) {
  console.log(`Admin already exists: ${email}`);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);
const user = await User.create({
  firstName: "System",
  lastName: "Admin",
  email,
  phone: "+94115550100",
  role: ROLES.ADMIN,
  passwordHash
});

await Staff.create({
  userId: user._id,
  employeeId: "ADMIN001",
  department: "Administration",
  role: ROLES.ADMIN,
  employmentDate: new Date()
});

console.log(`Seed admin created: ${email} / ${password}`);
process.exit(0);
