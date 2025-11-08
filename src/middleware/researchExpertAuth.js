import { verifyTokenMiddleware } from "../lib/jwt";
import User from "../models/User";

export const researchExpertAuth = (handler) => async (req, ...args) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verifyTokenMiddleware(token);
    if (!decoded) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "research-expert") {
      return new Response(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
      });
    }

    req.user = user;
    return handler(req, ...args);
  } catch (error) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
};
