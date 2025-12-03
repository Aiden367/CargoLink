import User from "../models/user.js";

export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId); // use ID from JWT
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = user; // attach user to request 
        next();
    } catch (err) {
        res.status(500).json({ message: "Error fetching user" });
    }
};

export default getUser;