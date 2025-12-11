import Vendor from "../models/vendor.js";


export const getVendor = async (req, res, next) => {
    try {
        const foundVendor = await Vendor.findOne({ vendorId: req.params.vendorId })
        if (foundVendor == null) {
            return res.status(400).json({ message: "Could not find vendor" })
        }
        req.vendor = foundVendor
        next();
    } catch (err) {
        res.status(500).json({ message: "Could not retrieve vendor" })
    }
}

export default getVendor;
