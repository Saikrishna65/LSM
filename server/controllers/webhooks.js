export const clerkWebhooks = async (req, res) => {
  try {
    console.log("🔹 Incoming Webhook Data:", req.body); // Log webhook data

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    await whook.verify(req.rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;
    console.log("🔹 Event Type:", type); // Log event type

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url,
        };
        console.log("🔹 Saving User:", userData); // Log user data
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
        console.log("🔹 Updating User:", userData); // Log user data
        await User.findByIdAndUpdate(data.id, userData);
        res.json({ success: true });
        break;
      }
      case "user.deleted": {
        console.log("🔹 Deleting User:", data.id); // Log user data
        await User.findByIdAndDelete(data.id);
        res.json({ success: true });
        break;
      }
      default:
        console.log("🔹 Unhandled Event Type:", type); // Log unhandled event
        res
          .status(400)
          .json({ success: false, message: "Unhandled event type" });
    }
  } catch (error) {
    console.error("❌ Webhook Error:", error); // Log error
    res.status(500).json({ success: false, message: error.message });
  }
};
