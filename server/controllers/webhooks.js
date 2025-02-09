import { Webhook } from "svix";
import User from "../models/User.js"; // Ensure the path and file extension are correct

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verify the webhook using raw body
    await whook.verify(req.rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created": {
        if (!data.email_addresses || data.email_addresses.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid user data" });
        }
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address, // Ensure this field exists
          name: `${data.first_name || ""} ${data.last_name || ""}`, // Handle potential undefined values
          imageUrl: data.image_url || null, // Default to null if image_url is not provided
        };
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
          email: data.email_addresses[0].email_address, // Ensure this field exists
          name: `${data.first_name || ""} ${data.last_name || ""}`, // Handle potential undefined values
          imageUrl: data.image_url || null, // Default to null if image_url is not provided
        };
        await User.findByIdAndUpdate(data.id, userData);
        return res.json({ success: true });
      }
      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        return res.json({ success: true });
      }
      default:
        return res
          .status(400)
          .json({ success: false, message: "Unhandled event type" });
    }
  } catch (error) {
    console.error("Webhook Error:", error); // Log the error for debugging
    return res.status(500).json({ success: false, message: error.message });
  }
};
