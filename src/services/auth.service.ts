import { AuthRequest, RegisterRequest } from "../types";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

export const registerUser = async (payload: RegisterRequest) => {
  //check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // message for existing user
  if (existingUser) {
    throw new Error("User with this email already exists");
  }
  const passwordHash = await bcrypt.hash(payload.password, 10);
  // create new user
  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash: passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
      phone: payload.phone,
      role: 'USER',
    },
  });
  return newUser;
};

export const loginUser = async (data: AuthRequest) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }
  return user;
}
