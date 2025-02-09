import { Webhook } from "svix";
import User from "../../models/User.js"; // Update the path if necessary

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
      await whook.verify(JSON.stringify(req.body), {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
      });

      const { data, type } = req.body;
      console.log("🔹 Webhook Received:", type);

      switch (type) {
        case "user.created": {
          const userData = {
            _id: data.id,
            email: data.email_addresses[0].email_address,
            name: `${data.first_name} ${data.last_name}`,
            imageUrl: data.image_url,
          };
          await User.create(userData);
          res.json({ success: true });
          break;
        }
        case "user.updated": {
          const userData = {
            email: data.email_addresses[0].email_address,
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
          break;
      }
    } else {
      res.status(405).json({ success: false, message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
