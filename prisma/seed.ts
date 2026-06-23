import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function seedUser({
  email,
  password,
  name,
  role
}: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) {
  if (password.length < 12) {
    throw new Error(`${role} seed password must be at least 12 characters.`);
  }

  const normalizedEmail = email.toLowerCase();

  const passwordHash = await hashPassword(password);

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      passwordHash,
      role,
      status: UserStatus.ACTIVE
    },
    create: {
      email: normalizedEmail,
      name,
      passwordHash,
      role,
      status: UserStatus.ACTIVE
    }
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const learnerEmail = process.env.SEED_LEARNER_EMAIL;
  const learnerPassword = process.env.SEED_LEARNER_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.");
  }

  if (!learnerEmail || !learnerPassword) {
    throw new Error("SEED_LEARNER_EMAIL and SEED_LEARNER_PASSWORD are required.");
  }

  const admin = await seedUser({
    email: adminEmail,
    password: adminPassword,
    name: "hackd Admin",
    role: Role.ADMIN
  });
  const learner = await seedUser({
    email: learnerEmail,
    password: learnerPassword,
    name: "hackd Learner",
    role: Role.LEARNER
  });

  console.log(`Seeded admin user: ${admin.email}`);
  console.log(`Seeded learner user: ${learner.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
