import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Admin Client (using Service Role Key)
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin: Create User
  app.post("/api/admin/create-user", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase Admin not configured" });
      }

      const { email, password, role, fullName } = req.body;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify the requester is an admin
      const token = authHeader.split(" ")[1];
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if requester is admin in profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      // Create the user in Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (createError) throw createError;

      // Update the profile role (the trigger might have already created it as 'customer')
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role })
        .eq("id", newUser.user.id);

      if (updateError) throw updateError;

      res.json({ success: true, user: newUser.user });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  // Admin: Delete User
  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase Admin not configured" });
      }

      const { userId } = req.body;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !adminUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();

      if (profile?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  // Admin: Update User Role
  app.post("/api/admin/update-user-role", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase Admin not configured" });
      }

      const { userId, role } = req.body;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !adminUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();

      if (profile?.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (updateError) throw updateError;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: error.message || "Failed to update user role" });
    }
  });

  // Admin: List Users
  app.get("/api/admin/users", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase Admin not configured" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

      const token = authHeader.split(" ")[1];
      const { data: { user: adminUser } } = await supabaseAdmin.auth.getUser(token);
      
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminUser?.id || "")
        .single();

      if (profile?.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const { data: profiles, error: listError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("email");

      if (listError) throw listError;

      res.json({ users: profiles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
