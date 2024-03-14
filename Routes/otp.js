const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const JWT = require("jsonwebtoken");
const User = require("../Models/userModel");
const Token = require("../Models/tokenModel");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const user = require("../Models/userModel");
const generateOTP = require("./generateotp");
require("dotenv").config();
// const staff = Staff.staff;

let otp

router.post("/sendOtp", async (req, res) => {
  console.log(req.body);
  let email = req.body.email;
  const user = await User.findOne({email});
  if (!email) {
    return res.status(400).json({ msg: "Please provide an email address." });
  }
  const checkMail = await user.findOne({ email });
  if (!checkMail) {
    return res.status(400).json({ msg: "Email not registered" });
  } else {
    let token = await Token.findOne({userId: user._id});
    if (token) await token.deleteOne();
    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, Number(bcryptSalt));

    await new Token({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();
    
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
    otp = generateOTP();
    console.log("otp : ", otp);

    var mailOptions = {
      from: `"No Reply" <${process.env.EMAIL}>`, // sender address
      to: `${email}`, // list of receivers
      subject: "Password Reset Request", // Subject line
      text: `Your password reset code is : ${otp}. This link will expire in 30 minutes. If you did not request a password reset please ignore this.`,
    };
    // }
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.error(`Error sending password reset request: ${err}`);
        return res
          .status(500)
          .json({ msg: "Error sending email. Please try again later." });
      } else {
        console.log(`Message sent: ${info.messageId}`);
        res.json({ msg: "Password reset request sent successfully." });
      }
    });
  }
});

router.post("/verifyOtp", async (req, res) => {
  let cotp = req.body.otp;
  console.log(otp);
  console.log(cotp);
  try {
    if (cotp == otp) {
      return res.status(200).json({ msg: "OTP Verified!" });
    } else {
      return res.status(401).json({ msg: "Invalid OTP." });
    }
  } catch (e) {
    res.status(500).json({ msg: e.toString() });
  }
});

module.exports = router;