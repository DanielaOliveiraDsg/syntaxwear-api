import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, loginWithGoogle, registerUser } from "../services/auth.service.js";
import { AuthRequest, RegisterRequest } from "../types/index.js";
import { loginSchema, registerSchema } from "../utils/validators.js";

const isProduction = process.env.NODE_ENV === "production";

export const register = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // validate registration payload
  const validation = registerSchema.parse(request.body as RegisterRequest);
  const user = await registerUser(validation, reply);
  if (!user) return;
  const token = request.server.jwt.sign({
    userId: user.id,
    role: user.role,
  });

  reply.setCookie("syntaxwear.token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  reply.status(201).send({ user});
};

export const login = async (
  request: FastifyRequest<{ Body: AuthRequest }>,
  reply: FastifyReply,
) => {
  const validation = loginSchema.parse(request.body as AuthRequest);

  const user = await loginUser(validation, reply);
  if (!user) return;

  const token = request.server.jwt.sign({
    userId: user.id,
  });

  reply.setCookie("syntaxwear.token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  reply.status(200).send({ user});
};

export const profile = async (
  request: FastifyRequest,
  reply: FastifyReply) => reply.status(200).send({ user: request.user });

export const googleLogin = async (
  request: FastifyRequest<{ Body: { credential: string } }>,
  reply: FastifyReply,
) => {
  const { credential } = request.body as { credential: string };
  if (!credential) {
    reply.status(400).send({ error: "Google credential is required" });
    return;
  }
  const user = await loginWithGoogle(credential, reply);
  if (!user) return;

  const token = request.server.jwt.sign({
    userId: user.id,
  });

  reply.setCookie("syntaxwear.token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  reply.status(200).send({ user });
}

export const logout = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  reply.clearCookie("syntaxwear.token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: "/",
  });
  reply.status(200).send({ message: "Logged out successfully" });
}