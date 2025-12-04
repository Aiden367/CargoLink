import Customer from '../models/customer.js'
export const getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({customerId:req.body.customerId })
        if (customer == null) {
            res.status(404).json({ messsage: "could not find customer" })
        }
        req.customer = customer 
        next();
    } catch (err) {
        res.status(401).json({ message: message.err })
    }
}

export default getCustomer;