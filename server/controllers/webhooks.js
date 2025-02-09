import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Use `req.rawBody` instead of `JSON.stringify(req.body)`
    await whook.verify(req.rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (
      type // Fix: Use `type` instead of `key`
    ) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address, // Fix: Correct field name
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url,
        };
        await User.create(userData);
        res.json({ success: true });
        break;
      }
      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address, // Fix: Correct field name
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.json({ success: true });
        break;
      }
      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.json({ success: true });
        break;
      }
      default:
        res
          .status(400)
          .json({ success: false, message: "Unhandled event type" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
