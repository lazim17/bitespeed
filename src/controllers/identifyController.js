const contactService = require("../services/contactService");

exports.handleIdentify = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phoneNumber required" });
    }

    const contact = await contactService.identifyContact({ email, phoneNumber });
    return res.status(200).json({ contact });
  } catch (error) {
    console.error("Error in identify handler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
