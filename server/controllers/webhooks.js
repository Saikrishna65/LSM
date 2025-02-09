import User from "../models/User.js";
import { Webhook } from "svix"; // Ensure you import Webhook if not already

export const clerkWebhooks = async (req, res) => {
  try {
    console.log("🔹 Incoming Webhook Data:", req.body);

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    await whook.verify(req.rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;
    console.log("🔹 Event Type:", type);

    switch (type) {
      case "user.created": {
        if (!data.email_addresses || data.email_addresses.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid user data" });
        }
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`,
          imageUrl: data.image_url,
        };
        console.log("🔹 Saving User:", userData);
        await User.create(userData);
        return res.json({ success: true });
      }
      case "user.updated": {
        if (!data.email_addresses || data.email_addresses.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid user data" });
        }
        const userData = {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`,
          imageUrl: data.image_url,
        };
        console.log("🔹 Updating User:", userData);
        await User.findByIdAndUpdate(data.id, userData);
        return res.json({ success: true });
      }
      case "user.deleted": {
        console.log("🔹 Deleting User:", data.id);
        await User.findByIdAndDelete(data.id);
        return res.json({ success: true });
      }
      default:
        console.log("🔹 Unhandled Event Type:", type);
        return res
          .status(400)
          .json({ success: false, message: "Unhandled event type" });
    }
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
