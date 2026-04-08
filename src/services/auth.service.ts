import { FastifyReply } from "fastify";
import { AuthRequest, RegisterRequest } from "../types/index.js";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

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
      role: "USER",
    },
  });
  return newUser;
};

export const loginUser = async (data: AuthRequest, reply: FastifyReply) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    reply.status(409).send({ error: "User with this email does not exist" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(
    data.password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    reply.status(409).send({ error: "Invalid password" });
    return;
  }
  return user;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginWithGoogle = async (credential: string, reply: FastifyReply) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    // unauthorized
    reply.status(401).send({ error: "Invalid Google token" });
  return;
  }

  const { email, given_name, family_name } = payload;

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // create new user if not exists
    user = await prisma.user.create({
      data: {
        email,
        firstName: given_name || "",
        lastName: family_name || "",
        passwordHash: "",
        role: "USER",
      },
    });
  }

  const { passwordHash, ...userWithoutPassword } = user;

  return userWithoutPassword;
}