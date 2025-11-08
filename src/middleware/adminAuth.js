import { verifyTokenMiddleware } from "../lib/jwt";
import User from "../models/User";

export const adminAuth =
  (handler) =>
  async (req, ...args) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const token = authHeader.split(" ")[1];
    console.log(token);
    try {
      const decoded = await verifyTokenMiddleware(token);
      console.log(decoded);
      if (!decoded) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
        });
      }
      const user = await User.findById(decoded.id);
      if (!user || user.role !== "admin") {
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
