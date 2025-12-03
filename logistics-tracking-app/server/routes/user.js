import { Router } from "express";
import User from "../models/user.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import getUser from "../middleware/recieveUsers.js"
const router = Router();


//Register user
router.get('/GetAllUsers', async (req, res) => {
    try {
        const users = await User.find()
        res.json(users)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})
router.get('/:id', (req, res) => {
    res.send(req.params.id)
})


router.post('/Register', async (req, res) => {
    const password = req.body.password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    })
    try {
        const newUser = await user.save()
        res.status(201).json(newUser)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

router.get("/FindOneUser/:id", getUser, async (req, res) => {
    res.send(res.user.firstName)
})


router.patch('/EditProfile/:id', getUser, async (req, res) => {
    if (req.body.username != null) {
        res.user.username = req.body.username
    }
    if (req.body.email != null) {
        res.user.email = req.body.email
    }
    try {
        const updatedUser = await res.user.save()
        res.json(updatedUser)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

router.delete('/DeleteUser/:id', getUser, async (req, res) => {
    try {
        await res.user.deleteOne();
        res.json({ message: "Deleted User" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post('/Login', async (req, res) => {

    const email = req.body.email;
    const password = req.body.password
    const user = await User.findOne({ email: email });
    if (user == null) {
        return res.status(400).json({ message: "User not found" })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid Password" })
    }

    const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
    }

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET)
    res.json({ accessToken: accessToken, message: "Login successful" })
})

export default router;
