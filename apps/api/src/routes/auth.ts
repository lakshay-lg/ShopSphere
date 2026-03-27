import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { env } from "../config.js";

const changePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const DUMMY_PASSWORD_HASH =
  "$2b$12$8xIOO8pilqc/eMk4RyFYuec4otNKJAkVtIVAA7fhHLm77DTIGQf/a";

function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/auth/register — 5 attempts per IP per minute
  app.post("/auth/register", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const parsed = registerBody.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    const token = signToken({ userId: user.id, email: user.email });
    return reply.status(201).send({ token, user });
  });

  // POST /api/auth/login — 10 attempts per IP per minute
  app.post("/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const parsed = loginBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input" });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Constant-time comparison guard — don't leak user existence
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = signToken({ userId: user.id, email: user.email });
    return reply.send({
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  });

  // GET /api/auth/me — verify token and return current user
  app.get("/auth/me", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "No token provided" });
    }

    const token = authHeader.slice(7);
    let payload: { userId: string; email: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        email: string;
      };
    } catch {
      return reply.status(401).send({ error: "Invalid or expired token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    return reply.send({ user });
  });

  // PATCH /api/auth/me — change password
  app.patch("/auth/me", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "No token provided" });
    }

    const token = authHeader.slice(7);
    let payload: { userId: string; email: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
    } catch {
      return reply.status(401).send({ error: "Invalid or expired token" });
    }

    const parsed = changePasswordBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return reply.status(400).send({ error: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    return reply.send({ ok: true, message: "Password updated successfully" });
  });
}
