import { RegisterRequest } from "../types";
import { prisma } from "../utils/prisma";

export const registerUser = async (payload: RegisterRequest) => {
  //check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // message for existing user
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // create new user
  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
      phone: payload.phone,
      role: 'USER',
    },
  });
  return newUser;
};
