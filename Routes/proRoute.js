const express = require('express');
const router = express.Router();
const User = require('../Models/userModel');
const Order = require('../Models/orderModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateInvoice, sendInvoiceEmail } = require('./invoice');
const secretKey = process.env.JWT_SECRET;


router.get('/getadmin', async (req, res) => {
    const orders = await Order.find({}, '_id address phoneNo cans totalCans deliverystatus')
        .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
        .exec();

    res.status(200).json({
        status: true,
        data: orders
    });
});

// Route handlers for user actions, {fetch, edit, delete}
router.get('/admin-users', async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).json({
            status: true,
            data: users
        })
    }
    catch (error) {
        console.log("🚀 ~ router.get ~ error:", error)
        res.status(200).json({
            status: false,
        })
    }
})

router.get('/delete-user', async (req, res) => {
    try {
        const userId = req.query.userId;
        // Use the userId parameter in your logic

        if (!userId)
            return res.status(401).json({
                status: false,
                message: 'Invalid User ID'
            })

        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });

        // Delete the user
        await User.deleteOne({ _id: userId });

        res.status(200).json({
            status: true,
            message: 'User deleted successfully'
        });

    }
    catch (err) {
        console.log("🚀 ~ router.get ~ err:", err)
        res.status(200).json({
            status: false,
        })
    }
})

router.post('/edit-user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { name, phoneNumber, email } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found',
            });
        }

        // Update user data
        user.name = name;
        user.phoneNumber = phoneNumber;
        user.email = email;
        await user.save();

        // Respond with success message
        res.status(200).json({
            status: true,
            message: 'User updated successfully',
            data: user, // Optionally, you can send back the updated user data
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to update user',
        });
    }
});


// Order related routes
router.delete('/deleteOrder', async (req, res) => {
    const phoneNo = req.query.phoneNo;

    try {
        const deletedOrder = await Order.findOneAndDelete({ phoneNo: phoneNo });
        if (deletedOrder) {
            return res.status(200).json({
                status: true,
                message: 'Order deleted successfully.',
                data: deletedOrder,
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Order not found with the given phone number.',
            });
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
});

router.post('/edit-order/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const editedData = req.body;

        // Update the order in the database using Mongoose
        const updatedOrder = await Order.findByIdAndUpdate(orderId, editedData, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ status: false, message: 'Order not found' });
        }

        // Send a success response with the updated order
        res.status(200).json({ status: true, data: updatedOrder });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
});

router.get('/user-orders/:phoneNum', async (req, res) => {
    try {
        const phoneNo = req.params.phoneNum;
        const orders = await Order.find(
            { phoneNo: phoneNo }, // Filter criteria
            '_id name address phoneNo cans totalCans deliverystatus', // Projection
        )
            .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
            .exec();

        res.status(200).json({
            status: true,
            data: orders
        });
    }
    catch (err) {

    }
})

router.get('/re-order/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const order = await Order.findById(id);

        const newOrder = {
            totalCans: order.totalCans,
            address: order.address,
            phoneNo: order.phoneNo,
            latitude: order.latitude,
            longitude: order.longitude,
            deliverystatus: 'Pending',
        }
        const createdOrder = await Order.create(newOrder);
        console.log(createdOrder)

        res.status(200).json({
            status: true,
            data: order
        });
    }
    catch (err) {

    }
})



router.post('/register', async (req, res) => {
    try {
        const { name, phoneNumber, email, password } = req.body;
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ error: 'UserExists', message: 'User with this phone number already exists' });

        }
        const existingEmailUser = await User.findOne({ email });

        if (existingEmailUser) {
            return res.status(400).json({ error: 'UserExists', message: 'User with this email already exists.' });
        }




        const newUser = new User({
            name,
            phoneNumber,
            email,
            password,
        });


        await newUser.save();
        res.status(200).send('User registration successful');
    } catch (error) {
        if (error.code === 11000 && error.keyPattern.email) {
            // Duplicate key error, email already exists
            res.status(400).send('Email is already in use');
        } else if (error.code === 11000 && error.keyPattern.phoneNumber) {
            // Duplicate key error, phone number already exists
            res.status(400).send('Phone number is already in use');
        } else {
            console.error(error);
            res.status(500).send('Error saving user to the database');
        }
    }
});


// Login route
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;

    try {
        // Find user by phone number
        const user = await User.findOne({ phoneNumber });
        console.log(user);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // User authentication successful, generate JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, 'secretKey', { expiresIn: '5m' });
        console.log(token)

        // Send token and role to client
        res.json({ token, role: user.role });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/Orders', async (req, res) => {
    try {
        const orders = new Order(req.body);
        await orders.save();

        // Find the user associated with the order
        const user = await User.findOne({ phoneNumber: orders.phoneNo });

        if (user) {
            // Generate and send the invoice email
            await sendInvoiceEmail(orders, user);
        } else {
            console.error('User not found for the order');
        }

        res.status(201).send(orders);
    } catch (error) {
        console.log(error)
        res.status(400).send(error);
    }
});

router.get('/', async (req, res) => {
    try {
        const orders = await Order.find();
        res.send(orders);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/orders-by-date/:date', async (req, res) => {
    try {
        const selectedDate = req.params.date;
        const orders = await Order.find({ bookingDate: selectedDate })
            .sort({ createdAt: -1 }) // Sort orders by createdAt field in descending order
            .exec();

        res.status(200).json({
            status: true,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching orders by date:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
});
   




module.exports = router;